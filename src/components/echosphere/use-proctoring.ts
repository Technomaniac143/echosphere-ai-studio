import { useCallback, useEffect, useRef, useState } from "react";
import { speakOnce } from "@/lib/speech";
import { recordMonitoringEvent, TURN_AWAY_LIMIT } from "@/lib/interview.functions";

export type IntegrityEvent = { id: number; kind: "look-away" | "tab-switch"; at: string; warning: number };

export { TURN_AWAY_LIMIT };

/**
 * Integrity monitoring for the live interview.
 *  - look-away detection from the camera (MediaPipe FaceLandmarker)
 *  - tab / window switch detection
 * Every violation is reported to the server, which owns the counter. After the
 * third warning the server terminates the interview and we fire `onTerminated`.
 */
export function useProctoring(enabled: boolean, threadId?: string, onTerminated?: (count: number) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [events, setEvents] = useState<IntegrityEvent[]>([]);
  const [faceTracking, setFaceTracking] = useState<"off" | "on" | "unavailable">("off");
  const [lookingAway, setLookingAway] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const terminatedRef = useRef(false);
  const onTerminatedRef = useRef(onTerminated);
  onTerminatedRef.current = onTerminated;

  const report = useCallback(async (kind: IntegrityEvent["kind"], detail: string) => {
    if (terminatedRef.current) return;
    let count = 0;
    let terminated = false;
    if (threadId) {
      try {
        const res = await recordMonitoringEvent({ data: { threadId, type: kind === "look-away" ? "look-away" : "window-blur", detail } });
        count = res.count;
        terminated = res.terminated;
      } catch {
        // Monitoring must never break the interview itself.
        count = warnings + 1;
      }
    } else {
      count = warnings + 1;
    }
    setWarnings(count);
    setEvents(e => [{ id: Date.now() + Math.random(), kind, at: new Date().toLocaleTimeString(), warning: count }, ...e].slice(0, 8));

    if (terminated) {
      terminatedRef.current = true;
      speakOnce("terminated", "This interview has been ended because of repeated monitoring violations.", 60000);
      onTerminatedRef.current?.(count);
    } else {
      const remaining = Math.max(0, TURN_AWAY_LIMIT - count);
      speakOnce(
        `${kind}-${count}`,
        kind === "look-away"
          ? `Warning ${count} of ${TURN_AWAY_LIMIT}. Please look at the camera. ${remaining === 1 ? "One more warning will end this interview." : ""}`
          : `Warning ${count} of ${TURN_AWAY_LIMIT}. Please return to the interview window. ${remaining === 1 ? "One more warning will end this interview." : ""}`,
        4000,
      );
    }
  }, [threadId, warnings]);

  // Tab / window switch
  useEffect(() => {
    if (!enabled) return;
    let away = false;
    const leave = () => {
      if (away || document.visibilityState === "visible") return;
      away = true;
      void report("tab-switch", "Candidate switched away from the interview window.");
    };
    const back = () => { away = false; };
    const onVisibility = () => (document.hidden ? leave() : back());
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", back);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", back);
    };
  }, [enabled, report]);

  // Camera + face orientation
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let stream: MediaStream | null = null;
    let raf = 0;
    let landmarker: { detectForVideo: (v: HTMLVideoElement, t: number) => { faceLandmarks?: unknown[] }; close?: () => void } | null = null;
    let awaySince: number | null = null;
    let lastReport = 0;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }
        const video = videoRef.current;
        if (video) { video.srcObject = stream; await video.play().catch(() => {}); }

        const vision = await import("@mediapipe/tasks-vision");
        const files = await vision.FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
        const created = await vision.FaceLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task" },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFacialTransformationMatrixes: true,
        });
        if (stopped) { created.close(); return; }
        landmarker = created as unknown as typeof landmarker;
        setFaceTracking("on");

        const tick = () => {
          const v = videoRef.current;
          if (stopped || !v || v.readyState < 2 || !landmarker) { raf = requestAnimationFrame(tick); return; }
          try {
            const result = landmarker.detectForVideo(v, performance.now()) as { faceLandmarks?: { x: number; y: number }[][] };
            const face = result.faceLandmarks?.[0];
            let away = true;
            if (face) {
              const nose = face[1]; const left = face[234]; const right = face[454];
              if (nose && left && right) {
                const span = Math.abs(right.x - left.x) || 1;
                const ratio = (nose.x - left.x) / span; // ~0.5 when facing the camera
                away = ratio < 0.3 || ratio > 0.7;
              } else {
                away = false;
              }
            }
            const now = performance.now();
            if (away) {
              awaySince ??= now;
              if (now - awaySince > 2500) {
                setLookingAway(true);
                if (now - lastReport > 12000) {
                  lastReport = now;
                  awaySince = now;
                  void report("look-away", "Candidate looked away from the camera.");
                }
              }
            } else {
              awaySince = null;
              setLookingAway(false);
            }
          } catch { /* skip frame */ }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        if (!stopped) setFaceTracking("unavailable");
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      landmarker?.close?.();
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [enabled, report]);

  return { videoRef, events, faceTracking, lookingAway, warnings, limit: TURN_AWAY_LIMIT };
}
