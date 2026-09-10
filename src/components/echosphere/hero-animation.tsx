/**
 * Ambient "AI panel" hero animation: a pulsing core with orbiting agent nodes.
 * Pure CSS/SVG, respects prefers-reduced-motion via the echo-* utilities.
 */
export function HeroPanelAnimation() {
  const nodes = [
    { label: "Technical", delay: "0s" },
    { label: "Product", delay: "-4s" },
    { label: "Manager", delay: "-8s" },
    { label: "Behavioral", delay: "-12s" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center opacity-90">
      <div className="relative size-[min(78vw,520px)]">
        <span className="echo-orbit-ring absolute inset-0 rounded-full border border-white/15" />
        <span className="echo-orbit-ring-slow absolute inset-[14%] rounded-full border border-highlight/35" />
        <span className="absolute inset-[30%] rounded-full border border-white/10" />
        <span className="echo-core absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-highlight/25 blur-xl" />
        <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/10 backdrop-blur">
          <span className="flex items-end gap-[3px]">
            {[0.5, 0.9, 1, 0.65, 0.4].map((h, i) => (
              <i key={i} className="echo-wave w-[3px] rounded-full bg-highlight" style={{ height: `${h * 26}px`, animationDelay: `${i * 90}ms` }} />
            ))}
          </span>
        </span>
        {nodes.map((n, i) => (
          <span key={n.label} className="echo-orbit absolute left-1/2 top-1/2 size-full -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: n.delay }}>
            <span className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white/85 backdrop-blur" style={{ transform: `translateX(-50%) rotate(${-i * 90}deg)` }}>
              {n.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
