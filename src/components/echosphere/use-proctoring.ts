import { useEffect, useRef, useState } from "react";
import { speakOnce } from "@/lib/speech";

export type IntegrityEvent = { id: number; kind: "look-away" | "tab-switch"; at: string };

/**
 * Client-side integrity signals for the interview page:
 *  - look-away detection from the live camera (MediaPipe FaceLandmarker)
 *  - tab / window switch detection
 * Both trigger a spoken alert once per event, with a cooldown.
 * NOTE (future): a real integrity backend will own this; nothing leaves the browser today.
 */
export function useProctoring(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [events, setEvents] = useState<IntegrityEvent[]>([]);
  const [faceTracking, setFaceTracking] = useState<"off" | "on" | "unavailable">("off");
  const [lookingAway, setLookingAway] = useState(false);

  function log(kind: IntegrityEvent["kind"]) {
    setEvents(e => [{ id: Date.now() + Math.random(), kind, at: new Date().toLocaleTimeString() }, ...e].slice(0, 8));
  }

  // Tab / window switch
  useEffect(() => {
    if (!enabled) return;
    let away = false;
    const leave = () => {
      if (away) return;
      away = true;
      log("tab-switch");
      speakOnce("tab-switch", "Please return to the interview window.", 8000);
    };
    const back = () => { away = false; };
    const onVisibility = () => (document.hidden ? leave() : back());
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", leave);
    window.addEventListener("focus", back);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", leave);
      window.removeEventListener("focus", back);
    };
  }, [enabled]);

  // Camera + face orientation
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let stream: MediaStream | null = null;
    let raf = 0;
    let landmarker: { detectForVideo: (v: HTMLVideoElement, t: number) => { faceLandmarks?: unknown[] }; close?: () => void } | null = null;
    let awaySince: number | null = null;

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
            const result = landmarker.detectForVideo(v, performance.now()) as {
              faceLandmarks?: { x: number; y: number }[][];
            };
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
                if (speakOnce("look-away", "Pay attention.", 15000)) log("look-away");
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
  }, [enabled]);

  return { videoRef, events, faceTracking, lookingAway };
}
