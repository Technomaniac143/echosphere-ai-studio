import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { askEcho } from "@/lib/echo.functions";
import { speak } from "@/lib/speech";

export type EchoMode = "idle" | "listening" | "thinking" | "speaking";

type Turn = { from: "you" | "echo"; text: string };

/** Minimal typing for the vendor-prefixed Web Speech API. */
type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  start: () => void; stop: () => void; abort: () => void;
  onresult: ((e: any) => void) | null; onerror: (() => void) | null; onend: (() => void) | null;
};

function createRecognition(): Recognition | null {
  const Ctor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
  if (!Ctor) return null;
  const r: Recognition = new Ctor();
  r.lang = "en-US";
  r.continuous = false;
  r.interimResults = false;
  return r;
}

export function EchoOrb({ mode = "idle", onClick, small = false }: { mode?: EchoMode; onClick?: () => void; small?: boolean }) {
  return <button onClick={onClick} aria-label="Activate Echo voice assistant" className={cn("echo-pulse relative grid rounded-full bg-brand text-white transition-transform hover:scale-105", small ? "size-11" : "size-16")}>
    <span className="absolute inset-[5px] rounded-full border border-white/30" />
    <span className="flex h-full items-center justify-center gap-[3px]">
      {[.5, .85, 1, .65, .4].map((height, i) => <i key={i} className={cn("w-[2px] rounded-full bg-white", mode !== "idle" && "echo-wave")} style={{ height: `${height * (small ? 16 : 23)}px`, animationDelay: `${i * 90}ms` }} />)}
    </span>
  </button>;
}

/**
 * Echo: a real voice + text assistant. It answers from the signed-in
 * candidate's own stored data and can navigate the app on request.
 * Say "Hey Echo, …" or type a question.
 */
export function EchoAssistant({ dark = false, hint = "What would you like to work on?" }: { dark?: boolean; hint?: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<EchoMode>("idle");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setVoiceAvailable(!!createRecognition()); }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 9e9 }); }, [turns, mode]);

  const ask = useCallback(async (question: string) => {
    const q = question.trim();
    if (!q) return;
    setError("");
    setTurns(t => [...t, { from: "you", text: q }]);
    setMode("thinking");
    try {
      const res = await askEcho({ data: { question: q } });
      setTurns(t => [...t, { from: "echo", text: res.reply }]);
      setMode("speaking");
      speak(res.reply);
      if (res.navigate) window.setTimeout(() => navigate({ to: res.navigate as string }), 900);
      window.setTimeout(() => setMode("idle"), 1200);
    } catch (e: any) {
      setMode("idle");
      setError(e?.message ?? "Echo could not answer just now.");
    }
  }, [navigate]);

  const listen = useCallback(() => {
    const recognition = recognitionRef.current ?? createRecognition();
    if (!recognition) { setError("Voice input is not supported in this browser. You can type instead."); return; }
    recognitionRef.current = recognition;
    setError("");
    setMode("listening");
    recognition.onresult = (e: any) => {
      const said: string = e.results?.[0]?.[0]?.transcript ?? "";
      // Strip the wake word so "Hey Echo, show my scores" asks the real question.
      const cleaned = said.replace(/^\s*(hey|hi|ok|okay)?\s*echo[,.!]?\s*/i, "").trim() || said;
      void ask(cleaned);
    };
    recognition.onerror = () => { setMode("idle"); setError("I couldn't hear that. Try again or type your question."); };
    recognition.onend = () => setMode(m => (m === "listening" ? "idle" : m));
    try { recognition.start(); } catch { /* already running */ }
  }, [ask]);

  useEffect(() => () => { recognitionRef.current?.abort?.(); }, []);

  return <div className="fixed bottom-5 right-5 z-50 flex items-end gap-3">
    {open && <div className={cn("flex w-[min(380px,calc(100vw-90px))] flex-col border p-4 shadow-2xl", dark ? "border-white/15 bg-[#211b27] text-white" : "border-foreground/20 bg-white")}>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-brand">Echo assistant</p>
          <p className="mt-1 text-sm font-semibold">{mode === "listening" ? "Listening…" : mode === "thinking" ? "Thinking…" : mode === "speaking" ? "Speaking" : hint}</p>
        </div>
        <button aria-label="Close Echo Assistant" onClick={() => setOpen(false)}><X className="size-4 opacity-60" /></button>
      </div>

      <div ref={scrollRef} className="max-h-64 space-y-3 overflow-y-auto pr-1">
        {turns.length === 0 && <p className={cn("text-xs leading-5", dark ? "text-white/60" : "text-muted-foreground")}>
          Try “show me my latest interview scores”, “how did I do on behavioral?” or “open my roadmap”.
        </p>}
        {turns.map((t, i) => <p key={i} className={cn("text-sm leading-6", t.from === "you"
          ? "ml-auto w-fit max-w-[85%] bg-brand px-3 py-1.5 text-white"
          : cn("border-l-2 border-highlight pl-3", dark ? "text-white/75" : "text-muted-foreground"))}>{t.text}</p>)}
        {mode === "thinking" && <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Checking your records…</p>}
      </div>

      {error && <p className="mt-3 border-l-2 border-red-400 pl-3 text-xs text-red-500">{error}</p>}

      <form onSubmit={e => { e.preventDefault(); const q = input; setInput(""); void ask(q); }} className="mt-3 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask Echo anything…" aria-label="Ask Echo"
          className={cn("h-9 flex-1 border px-3 text-sm outline-none focus:border-brand", dark ? "border-white/20 bg-white/5 text-white" : "border-foreground/20 bg-white")} />
        <button type="submit" aria-label="Send to Echo" className="grid size-9 place-items-center bg-brand text-white disabled:opacity-40" disabled={!input.trim() || mode === "thinking"}><Send className="size-4" /></button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {voiceAvailable && <button onClick={listen} className={cn("border px-2.5 py-1.5 text-[11px]", dark ? "border-white/15 hover:bg-white/10" : "border-foreground/15 hover:bg-muted")}>🎙 Speak to Echo</button>}
        {["My latest scores", "Where am I weakest?", "Open my roadmap"].map(x =>
          <button onClick={() => void ask(x)} key={x} className={cn("border px-2.5 py-1.5 text-[11px]", dark ? "border-white/15 hover:bg-white/10" : "border-foreground/15 hover:bg-muted")}>{x}</button>)}
      </div>
    </div>}
    <div className="flex flex-col items-center gap-1.5">
      <EchoOrb small onClick={() => { if (!open) { setOpen(true); } else if (voiceAvailable) { listen(); } }} mode={mode} />
      <span className={cn("font-mono text-[9px] uppercase tracking-wider", dark ? "text-white/65" : "text-muted-foreground")}>Hey Echo</span>
    </div>
  </div>;
}
