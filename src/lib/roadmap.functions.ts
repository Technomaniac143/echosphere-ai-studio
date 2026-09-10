import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const defaultSteps = [
  { title: "Sharpen system-design tradeoffs", dimension: "Technical", weeks: "Week 1–2", status: "done" },
  { title: "Quantify project outcomes with metrics", dimension: "Communication", weeks: "Week 2–3", status: "done" },
  { title: "Connect technical decisions to customer impact", dimension: "Product Thinking", weeks: "Week 3–4", status: "done" },
  { title: "Practice STAR-format behavioral responses", dimension: "Behavioral", weeks: "Week 4–5", status: "done" },
  { title: "Deep-dive distributed systems fundamentals", dimension: "Technical", weeks: "Week 5–6", status: "done" },
  { title: "Lead a mock design review end-to-end", dimension: "Leadership", weeks: "Week 6–7", status: "done" },
  { title: "Estimate scale: QPS, storage, and latency math", dimension: "Problem Solving", weeks: "Week 7–8", status: "current" },
  { title: "Frame ambiguous prompts with clarifying questions", dimension: "Adaptability", weeks: "Week 8–9", status: "upcoming" },
  { title: "Run a full product-sense mock interview", dimension: "Product Thinking", weeks: "Week 9–10", status: "upcoming" },
  { title: "Final mixed-panel mock and review", dimension: "All dimensions", weeks: "Week 10", status: "upcoming" },
] as const;

export const getRoadmap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await ((context.supabase as any) as any)
      .from("roadmap_progress")
      .select("steps")
      .eq("user_id", context.userId)
      .single();
    const steps = (data?.steps as any[]) ?? defaultSteps.map(s => ({ ...s }));
    const done = steps.filter((s: any) => s.status === "done").length;
    const current = steps.find((s: any) => s.status === "current");
    return { steps, done, current: current ?? steps[steps.length - 1] };
  });

export const updateRoadmapStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => input as { title: string; status: string })
  .handler(async ({ data, context }) => {
    const { data: existing } = await ((context.supabase as any) as any)
      .from("roadmap_progress")
      .select("id, steps")
      .eq("user_id", context.userId)
      .single();
    const steps = (existing?.steps as any[]) ?? defaultSteps.map(s => ({ ...s }));
    const next = steps.map((s: any) =>
      s.title === data.title ? { ...s, status: data.status } : s,
    );
    if (existing?.id) {
      await ((context.supabase as any) as any).from("roadmap_progress").update({ steps: next }).eq("id", existing.id);
    } else {
      await ((context.supabase as any) as any).from("roadmap_progress").insert({ user_id: context.userId, steps: next });
    }
    return { ok: true };
  });
