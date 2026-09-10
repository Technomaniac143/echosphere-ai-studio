import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Eraser, MousePointer2, MoveRight, Pen, RotateCcw, Square, Trash2, Type } from "lucide-react";

type Tool = "pen" | "node" | "arrow" | "text" | "eraser";

type Shape =
  | { kind: "path"; color: string; points: { x: number; y: number }[] }
  | { kind: "node"; color: string; x: number; y: number; w: number; h: number; label: string }
  | { kind: "arrow"; color: string; x1: number; y1: number; x2: number; y2: number }
  | { kind: "text"; color: string; x: number; y: number; text: string };

const colors = ["#5b2ee0", "#111827", "#e0602e", "#1d9e6d"];

export default function WhiteboardPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("node");
  const [color, setColor] = useState(colors[0]!);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const draft = useRef<Shape | null>(null);
  const drawing = useRef(false);

  useEffect(() => { redraw(); });

  function ctx2d() { return canvasRef.current?.getContext("2d") ?? null; }

  function redraw() {
    const canvas = canvasRef.current; const ctx = ctx2d();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#ece7f4"; ctx.lineWidth = 1;
    for (let x = 24; x < canvas.width; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 24; y < canvas.height; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
    const all = draft.current ? [...shapes, draft.current] : shapes;
    for (const s of all) drawShape(ctx, s);
  }

  function drawShape(ctx: CanvasRenderingContext2D, s: Shape) {
    ctx.strokeStyle = s.color; ctx.fillStyle = s.color; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (s.kind === "path") {
      ctx.beginPath();
      s.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    } else if (s.kind === "node") {
      ctx.beginPath();
      ctx.roundRect(s.x, s.y, s.w, s.h, 8);
      ctx.stroke();
      ctx.save(); ctx.globalAlpha = 0.06; ctx.fill(); ctx.restore();
      ctx.font = "13px 'Space Grotesk', sans-serif";
      ctx.fillText(s.label, s.x + 10, s.y + s.h / 2 + 4);
    } else if (s.kind === "arrow") {
      ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke();
      const angle = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
      ctx.beginPath();
      ctx.moveTo(s.x2, s.y2);
      ctx.lineTo(s.x2 - 10 * Math.cos(angle - 0.4), s.y2 - 10 * Math.sin(angle - 0.4));
      ctx.lineTo(s.x2 - 10 * Math.cos(angle + 0.4), s.y2 - 10 * Math.sin(angle + 0.4));
      ctx.closePath(); ctx.fill();
    } else {
      ctx.font = "14px 'Space Grotesk', sans-serif";
      ctx.fillText(s.text, s.x, s.y);
    }
  }

  function pos(e: React.PointerEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onDown(e: React.PointerEvent) {
    const p = pos(e);
    if (tool === "text") {
      const text = window.prompt("Label text");
      if (text) setShapes(s => [...s, { kind: "text", color, x: p.x, y: p.y, text }]);
      return;
    }
    if (tool === "eraser") {
      setShapes(s => s.filter(shape => !hit(shape, p)));
      return;
    }
    drawing.current = true;
    canvasRef.current?.setPointerCapture(e.pointerId);
    if (tool === "pen") draft.current = { kind: "path", color, points: [p] };
    if (tool === "node") draft.current = { kind: "node", color, x: p.x, y: p.y, w: 0, h: 0, label: "" };
    if (tool === "arrow") draft.current = { kind: "arrow", color, x1: p.x, y1: p.y, x2: p.x, y2: p.y };
    redraw();
  }

  function onMove(e: React.PointerEvent) {
    if (!drawing.current || !draft.current) return;
    const p = pos(e);
    const d = draft.current;
    if (d.kind === "path") d.points.push(p);
    if (d.kind === "node") { d.w = p.x - d.x; d.h = p.y - d.y; }
    if (d.kind === "arrow") { d.x2 = p.x; d.y2 = p.y; }
    redraw();
  }

  function onUp() {
    if (!drawing.current) return;
    drawing.current = false;
    const d = draft.current;
    draft.current = null;
    if (!d) return;
    if (d.kind === "node") {
      if (Math.abs(d.w) < 20 || Math.abs(d.h) < 16) { redraw(); return; }
      if (d.w < 0) { d.x += d.w; d.w = -d.w; }
      if (d.h < 0) { d.y += d.h; d.h = -d.h; }
      d.label = window.prompt("Node name", "Service") ?? "Service";
    }
    setShapes(s => [...s, d]);
  }

  function hit(s: Shape, p: { x: number; y: number }) {
    if (s.kind === "node") return p.x >= s.x - 6 && p.x <= s.x + s.w + 6 && p.y >= s.y - 6 && p.y <= s.y + s.h + 6;
    if (s.kind === "path") return s.points.some(pt => Math.hypot(pt.x - p.x, pt.y - p.y) < 12);
    if (s.kind === "arrow") return Math.hypot(s.x1 - p.x, s.y1 - p.y) < 14 || Math.hypot(s.x2 - p.x, s.y2 - p.y) < 14;
    return Math.hypot(s.x - p.x, s.y - p.y) < 24;
  }

  const tools: { id: Tool; icon: typeof Pen; label: string }[] = [
    { id: "node", icon: Square, label: "Node" },
    { id: "arrow", icon: MoveRight, label: "Arrow" },
    { id: "pen", icon: Pen, label: "Pen" },
    { id: "text", icon: Type, label: "Text" },
    { id: "eraser", icon: Eraser, label: "Erase" },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-foreground/10 px-3 py-2">
        {tools.map(t => (
          <button key={t.id} onClick={() => setTool(t.id)} title={t.label} className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium", tool === t.id ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:bg-muted/70")}>
            <t.icon className="size-3.5" />{t.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-foreground/15" />
        {colors.map(c => (
          <button key={c} aria-label={`Colour ${c}`} onClick={() => setColor(c)} className={cn("size-5 rounded-full border-2", color === c ? "border-foreground" : "border-transparent")} style={{ background: c }} />
        ))}
        <span className="ml-auto flex gap-2">
          <button onClick={() => setShapes(s => s.slice(0, -1))} title="Undo" className="rounded-full bg-muted p-1.5 text-muted-foreground hover:bg-muted/70"><RotateCcw className="size-3.5" /></button>
          <button onClick={() => setShapes([])} title="Clear" className="rounded-full bg-muted p-1.5 text-red-500 hover:bg-muted/70"><Trash2 className="size-3.5" /></button>
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <canvas
          ref={canvasRef}
          width={640}
          height={380}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          className="w-full cursor-crosshair rounded-xl border border-foreground/15 touch-none"
        />
      </div>
      <p className="flex items-center gap-2 border-t border-foreground/10 px-3 py-2 text-[11px] text-muted-foreground"><MousePointer2 className="size-3" /> Drag to place nodes and arrows for architecture sketches.</p>
    </div>
  );
}
