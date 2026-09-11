import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Camera, CheckCircle2, Download, Mic, Pause, Radio, RefreshCw, Settings2 } from "lucide-react";

const violetButton =
  "rounded-none bg-brand px-5 font-semibold text-white shadow-[4px_4px_0_#16121d] hover:bg-brand/90";

type Props = { limitSeconds?: number; onComplete?: (blob: Blob) => void };

/**
 * Real-time camera + microphone recorder with device settings.
 * Everything stays in the browser: nothing is uploaded.
 */
export function CameraRecorder({ limitSeconds = 30, onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [cameraId, setCameraId] = useState("");
  const [micId, setMicId] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [level, setLevel] = useState(0);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [clipUrl, setClipUrl] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    try { audioCtxRef.current?.close(); } catch { /* noop */ }
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async (camId?: string, mic?: string) => {
    setError(null);
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: camId ? { deviceId: { exact: camId } } : { facingMode: "user", width: { ideal: 1280 } },
        audio: mic ? { deviceId: { exact: mic }, echoCancellation: true, noiseSuppression: true } : { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setReady(true);

      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameras(devices.filter((d) => d.kind === "videoinput"));
      setMics(devices.filter((d) => d.kind === "audioinput"));
      const vTrack = stream.getVideoTracks()[0];
      const aTrack = stream.getAudioTracks()[0];
      if (vTrack) setCameraId(vTrack.getSettings().deviceId ?? "");
      if (aTrack) setMicId(aTrack.getSettings().deviceId ?? "");

      // Live microphone level meter
      const AudioCtor = window.AudioContext ?? (window as any).webkitAudioContext;
      const ctx: AudioContext = new AudioCtor();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let peak = 0;
        for (const v of buf) peak = Math.max(peak, Math.abs(v - 128) / 128);
        setLevel(peak);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e: any) {
      setReady(false);
      setError(e?.name === "NotAllowedError"
        ? "Camera and microphone access was blocked. Allow it in your browser and try again."
        : e?.message ?? "Could not start your camera.");
    }
  }, [stopStream]);

  useEffect(() => { void start(); return () => { stopStream(); }; }, [start, stopStream]);

  // Recording timer
  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setSeconds((s) => {
      if (s + 1 >= limitSeconds) { stopRecording(); return limitSeconds; }
      return s + 1;
    }), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, limitSeconds]);

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    if (clipUrl) { URL.revokeObjectURL(clipUrl); setClipUrl(null); }
    const mime = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
      .find((m) => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || "video/webm" });
      setClipUrl(URL.createObjectURL(blob));
      onComplete?.(blob);
    };
    rec.start(250);
    recorderRef.current = rec;
    setSeconds(0);
    setRecording(true);
  }

  function stopRecording() {
    try { recorderRef.current?.stop(); } catch { /* noop */ }
    recorderRef.current = null;
    setRecording(false);
  }

  return (
    <div>
      <div className="relative aspect-video overflow-hidden border border-foreground/15 bg-black">
        {clipUrl ? (
          <video src={clipUrl} controls playsInline className="size-full object-cover" />
        ) : (
          <video ref={videoRef} autoPlay muted playsInline className="size-full object-cover" />
        )}

        {!ready && !clipUrl && (
          <div className="absolute inset-0 grid place-items-center bg-[#12101a] px-6 text-center">
            <div className="space-y-3">
              <p className="text-sm text-white/75">{error ?? "Starting your camera…"}</p>
              {error && (
                <Button onClick={() => void start(cameraId, micId)} className={violetButton}>
                  <RefreshCw className="size-4" /> Try again
                </Button>
              )}
            </div>
          </div>
        )}

        {recording && (
          <span className="absolute left-4 top-4 flex items-center gap-2 bg-red-500 px-3 py-1.5 font-mono text-[10px] text-white">
            <i className="size-2 rounded-full bg-white" /> RECORDING
          </span>
        )}

        {ready && !clipUrl && (
          <button
            type="button"
            onClick={() => setShowSettings((s) => !s)}
            className="absolute right-4 top-4 flex items-center gap-2 border border-white/25 bg-black/55 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white hover:bg-black/75"
          >
            <Settings2 className="size-3.5" /> Settings
          </button>
        )}

        {showSettings && !clipUrl && (
          <div className="absolute right-4 top-14 w-72 space-y-3 border border-foreground/20 bg-card p-4 text-left shadow-[6px_6px_0_rgba(25,18,35,.2)]">
            <label className="block">
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><Camera className="size-3.5" /> Camera</span>
              <select
                value={cameraId}
                onChange={(e) => { setCameraId(e.target.value); void start(e.target.value, micId); }}
                className="mt-1 w-full border border-foreground/20 bg-background p-2 text-xs"
              >
                {cameras.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><Mic className="size-3.5" /> Microphone</span>
              <select
                value={micId}
                onChange={(e) => { setMicId(e.target.value); void start(cameraId, e.target.value); }}
                className="mt-1 w-full border border-foreground/20 bg-background p-2 text-xs"
              >
                {mics.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${i + 1}`}</option>)}
              </select>
            </label>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Input level</span>
              <div className="mt-1 h-2 w-full bg-foreground/10">
                <div className="h-full bg-brand transition-[width] duration-100" style={{ width: `${Math.min(100, Math.round(level * 180))}%` }} />
              </div>
            </div>
          </div>
        )}

        {recording && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-16 items-end justify-center gap-1 bg-gradient-to-t from-black/80 pb-3">
            {Array.from({ length: 44 }, (_, i) => (
              <i key={i} className="w-1 bg-highlight transition-[height] duration-100"
                 style={{ height: `${6 + level * 60 * (0.5 + ((i * 37) % 100) / 100)}px` }} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Live camera recorder</p>
          <p className="mt-1 text-2xl font-semibold">{seconds}s <span className="text-muted-foreground">/ {limitSeconds}s</span></p>
        </div>
        <div className="flex flex-wrap gap-3">
          {clipUrl ? (
            <>
              <Button variant="outline" className="rounded-none" onClick={() => { URL.revokeObjectURL(clipUrl); setClipUrl(null); setSeconds(0); void start(cameraId, micId); }}>
                <RefreshCw className="size-4" /> Retake
              </Button>
              <a href={clipUrl} download="echosphere-sample.webm">
                <Button variant="outline" className="rounded-none"><Download className="size-4" /> Download</Button>
              </a>
            </>
          ) : (
            <Button disabled={!ready} onClick={() => (recording ? stopRecording() : startRecording())}
              className={cn(recording ? "rounded-none bg-red-500 text-white hover:bg-red-500/90" : violetButton)}>
              {recording ? <><Pause className="size-4" /> Stop Recording</> : <><Radio className="size-4" /> Start Recording</>}
            </Button>
          )}
        </div>
      </div>

      {clipUrl && (
        <div className="mt-5 border border-success/30 bg-success/5 p-4 text-sm text-success">
          <CheckCircle2 className="mr-2 inline size-4" /> Recording complete · {seconds} seconds · Ready for review
        </div>
      )}
    </div>
  );
}

export default CameraRecorder;
