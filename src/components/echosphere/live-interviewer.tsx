import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, PhoneCall } from "lucide-react";
import { getAgoraSession, getAnamSession } from "@/lib/realtime.functions";

export type LiveMessage = { from: "assistant" | "user"; text: string };

type Props = {
  threadId: string;
  company: string;
  role: string;
  domain: string;
  candidateName: string;
  muted: boolean;
  paused: boolean;
  onTranscript: (messages: LiveMessage[]) => void;
  className?: string;
};

type Status = "idle" | "connecting" | "live" | "error";

/**
 * Live interviewer: Anam digital human for the visible/spoken interviewer,
 * Agora RTC for the candidate's noise-suppressed microphone channel.
 * Both SDKs are imported lazily so they never run during SSR.
 */
export function LiveInterviewer({
  threadId, company, role, domain, candidateName, muted, paused, onTranscript, className,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const anamRef = useRef<any>(null);
  const agoraRef = useRef<{ client: any; track: any } | null>(null);
  const startAnam = useServerFn(getAnamSession);
  const startAgora = useServerFn(getAgoraSession);
  const videoId = `anam-video-${threadId}`;

  const stop = useCallback(async () => {
    try { await anamRef.current?.stopStreaming?.(); } catch { /* noop */ }
    anamRef.current = null;
    const agora = agoraRef.current;
    agoraRef.current = null;
    try {
      agora?.track?.stop?.();
      agora?.track?.close?.();
      await agora?.client?.leave?.();
    } catch { /* noop */ }
  }, []);

  useEffect(() => () => { void stop(); }, [stop]);

  async function connect() {
    setStatus("connecting");
    setError(null);
    try {
      const [{ default: AgoraRTC }, anamSdk] = await Promise.all([
        import("agora-rtc-sdk-ng"),
        import("@anam-ai/js-sdk"),
      ]);
      AgoraRTC.setLogLevel(3);

      // --- Agora: candidate microphone channel with noise suppression ---
      let micStream: MediaStream | undefined;
      try {
        const cred = await startAgora({ data: { threadId } });
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        await client.join(cred.appId, cred.channel, cred.token, cred.uid);
        const track = await AgoraRTC.createMicrophoneAudioTrack({
          AEC: true, ANS: true, AGC: true,
          encoderConfig: "speech_standard",
        });
        await client.publish(track);
        agoraRef.current = { client, track };
        const mediaTrack = track.getMediaStreamTrack();
        micStream = new MediaStream([mediaTrack]);
      } catch (e) {
        console.error("Agora channel unavailable, falling back to direct mic", e);
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      // --- Anam: digital human interviewer ---
      const { sessionToken } = await startAnam({
        data: { company, role, domain, candidateName },
      });
      const anam = anamSdk.createClient(sessionToken);
      anamRef.current = anam;

      anam.addListener("MESSAGE_HISTORY_UPDATED" as any, (messages: any[]) => {
        onTranscript(
          messages
            .filter((m) => m?.content)
            .map((m) => ({
              from: m.role === "user" ? ("user" as const) : ("assistant" as const),
              text: String(m.content),
            })),
        );
      });
      anam.addListener("CONNECTION_CLOSED" as any, () => setStatus("idle"));

      await anam.streamToVideoElement(videoId, micStream);
      setStatus("live");
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Could not start the live interviewer.");
      setStatus("error");
      void stop();
    }
  }

  // Mirror mute / pause into the live session.
  useEffect(() => {
    const silence = muted || paused;
    try {
      agoraRef.current?.track?.setEnabled?.(!silence);
      if (silence) anamRef.current?.muteInputAudio?.();
      else anamRef.current?.unmuteInputAudio?.();
    } catch { /* noop */ }
  }, [muted, paused]);

  return (
    <div className={cn("relative size-full", className)}>
      <video
        id={videoId}
        autoPlay
        playsInline
        className={cn("aspect-video w-full bg-[#0d1117] object-cover", status !== "live" && "opacity-0")}
      />
      {status !== "live" && (
        <div className="absolute inset-0 grid place-items-center bg-[#0d1117] px-6 text-center">
          {status === "connecting" ? (
            <p className="flex items-center gap-2 text-sm text-white/80">
              <Loader2 className="size-4 animate-spin" /> Connecting your interviewer…
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-white/70">
                {error ?? "Your AI interviewer will appear and speak with you live."}
              </p>
              <Button onClick={connect} className="rounded-full bg-brand text-white hover:bg-brand/90">
                <PhoneCall className="size-4" /> {status === "error" ? "Try again" : "Start live interview"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
