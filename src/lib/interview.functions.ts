import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CompetencySchema = z.object({ name: z.string(), score: z.number().min(0).max(100) });

const CreateInterviewSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  domain: z.string().min(1),
});

const SaveInterviewSchema = z.object({
  id: z.string().uuid(),
  transcript: z.string().max(50000),
  notes: z.string().max(20000),
  competency_scores: z.array(CompetencySchema).max(20),
  cumulative: z.number().min(0).max(100),
});

export const listInterviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("interview_threads")
      .select("id, company, role, domain, created_at, cumulative_score, competency_scores")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      company: row.company,
      role: row.role,
      domain: row.domain,
      date: new Date(row.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      cumulative: row.cumulative_score ?? 0,
      competencies: Array.isArray(row.competency_scores) ? row.competency_scores : [],
    }));
  });

export const getInterview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await (context.supabase as any)
      .from("interview_threads")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (error) throw error;
    return row;
  });

export const createInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateInterviewSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await (context.supabase as any)
      .from("interview_threads")
      .insert({
        user_id: context.userId,
        company: data.company,
        role: data.role,
        domain: data.domain,
        status: "active",
      } as any)
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const saveInterviewResults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SaveInterviewSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("interview_threads")
      .update({
        transcript: data.transcript,
        notes: data.notes,
        competency_scores: data.competency_scores,
        cumulative_score: data.cumulative,
        status: "completed",
      } as any)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const appendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ threadId: z.string().uuid(), role: z.enum(["user", "assistant"]), content: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("interview_messages")
      .insert({
        thread_id: data.threadId,
        user_id: context.userId,
        role: data.role,
        content: { text: data.content },
        status: "sent",
      } as any);
    if (error) throw error;
    return { ok: true };
  });
