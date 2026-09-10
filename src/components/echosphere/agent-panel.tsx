import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

/**
 * The four interviewer personas with a scripted "active speaker" hand-off.
 * NOTE (future): a real Turn Arbiter and AI digital humans will drive this
 * state; the rotation below is a visual placeholder.
 */
export const agents = [
  { key: "technical", name: "Alex", role: "Technical", initials: "A", accent: "bg-brand" },
  { key: "product", name: "Maya", role: "Product", initials: "M", accent: "bg-info" },
  { key: "manager", name: "Daniel", role: "Hiring Manager", initials: "D", accent: "bg-success" },
  { key: "behavioral", name: "Sophia", role: "Behavioral", initials: "S", accent: "bg-highlight" },
] as const;

export function useAgentRotation(active = true, intervalMs = 5000) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setIndex(i => (i + 1) % agents.length), intervalMs);
    return () => window.clearInterval(id);
  }, [active, intervalMs]);
  return index;
}

export function AgentPanel({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Interview panel</p>
        <span className="flex items-center gap-2 text-[11px] font-medium text-brand"><i className="size-2 rounded-full bg-brand" /> {agents[activeIndex]!.name} speaking</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {agents.map((a, i) => {
          const active = i === activeIndex;
          return (
            <div key={a.key} className={cn("relative rounded-xl border p-3 transition", active ? "border-brand bg-brand/5 shadow-[0_0_0_3px_color-mix(in_oklab,var(--brand)_18%,transparent)]" : "border-foreground/10 bg-muted/40")}>
              <span className={cn("grid size-9 place-items-center rounded-full text-sm font-semibold text-white", a.accent, !active && "opacity-60")}>{a.initials}</span>
              <p className="mt-3 text-sm font-semibold">{a.name}</p>
              <p className="text-[11px] text-muted-foreground">{a.role}</p>
              <span className="mt-3 flex h-4 items-end gap-[3px]">
                {[0.5, 0.9, 0.6, 1, 0.45].map((h, k) => (
                  <i key={k} className={cn("w-[3px] rounded-full", active ? "echo-wave bg-brand" : "bg-foreground/15")} style={{ height: `${h * 14}px`, animationDelay: `${k * 90}ms` }} />
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
