import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const TURN_AWAY_LIMIT = 3;

export type TerminationReason = "completed" | "cheating" | "language" | "candidate_ended";

const CompetencySchema = z.object({ name: z.string(), score: z.number().min(0).max(100) });

const CreateInterviewSchema = z.object({
  company: z.string().min(1).max(120),
  role: z.string().min(1).max(120),
  domain: z.string().min(1).max(120),
  difficulty: z.enum(["easy", "medium", "hard", "expert"]).optional().default("medium"),
});

const SaveInterviewSchema = z.object({
  threadId: z.string().uuid(),
  transcript: z.string().max(50000),
  notes: z.string().max(20000).optional().default(""),
  competency_scores: z.array(CompetencySchema).max(20).optional().default([]),
  cumulative: z.number().min(0).max(100).optional().default(0),
});

const SELECT_LIST = "id, company, role, domain, status, created_at, ended_at, cumulative_score, overall_score, technical_score, behavioral_score, product_manager_score, hiring_manager_score, competency_scores, termination_reason, turn_away_count, difficulty";

export const listInterviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("interview_threads")
      .select(SELECT_LIST)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      company: row.company,
      role: row.role,
      domain: row.domain,
      status: row.status,
      date: new Date(row.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      created_at: row.created_at,
      cumulative: row.overall_score ?? row.cumulative_score ?? 0,
      technical: row.technical_score,
      behavioral: row.behavioral_score,
      productManager: row.product_manager_score,
      hiringManager: row.hiring_manager_score,
      competencies: Array.isArray(row.competency_scores) ? row.competency_scores : [],
      terminationReason: row.termination_reason,
      turnAwayCount: row.turn_away_count ?? 0,
      difficulty: row.difficulty,
    }));
  });

export const getInterview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ threadId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("interview_threads")
      .select("*")
      .eq("id", data.threadId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return row;
  });

export const createInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateInterviewSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Reuse the candidate's stored project analysis so the interviewer can ask about it.
    const { data: profile } = await context.supabase
      .from("candidate_profiles")
      .select("github_analysis")
      .eq("user_id", context.userId)
      .maybeSingle();

    const { data: row, error } = await context.supabase
      .from("interview_threads")
      .insert({
        user_id: context.userId,
        company: data.company,
        role: data.role,
        domain: data.domain,
        status: "active",
        difficulty: data.difficulty,
        started_at: new Date().toISOString(),
        github_context: (profile as any)?.github_analysis ?? null,
      } as any)
      .select()
      .single();
    if (error) throw error;
    return row;
  });

/** Records verified device state for the interview session. */
export const setDeviceStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    threadId: z.string().uuid(),
    camera: z.enum(["active", "inactive", "denied", "unknown"]).optional(),
    microphone: z.enum(["active", "inactive", "denied", "unknown"]).optional(),
    screenShare: z.enum(["entire-screen", "invalid-surface", "stopped", "denied", "unknown"]).optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const patch: Record<string, any> = {};
    if (data.camera) patch['camera_status'] = data.camera;
    if (data.microphone) patch['microphone_status'] = data.microphone;
    if (data.screenShare) patch['screen_share_status'] = data.screenShare;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await context.supabase
      .from("interview_threads").update(patch as any)
      .eq("id", data.threadId).eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

/**
 * Server-authoritative monitoring. The browser reports an event; the server owns
 * the counter and decides when the three-warning limit terminates the interview.
 */
export const recordMonitoringEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    threadId: z.string().uuid(),
    type: z.enum(["look-away", "window-blur", "screen-share-stopped", "screen-share-invalid", "camera-lost", "microphone-lost"]),
    detail: z.string().max(500).optional().default(""),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: thread, error: readError } = await context.supabase
      .from("interview_threads")
      .select("turn_away_count, status")
      .eq("id", data.threadId).eq("user_id", context.userId).maybeSingle();
    if (readError) throw readError;
    if (!thread) throw new Error("Interview not found.");
    if ((thread as any).status !== "active") {
      return { count: (thread as any).turn_away_count ?? 0, limit: TURN_AWAY_LIMIT, terminated: true };
    }

    await context.supabase.from("monitoring_events").insert({
      thread_id: data.threadId, user_id: context.userId, event_type: data.type, detail: data.detail,
    } as any);

    const counts = data.type === "look-away" || data.type === "window-blur";
    const next = counts ? ((thread as any).turn_away_count ?? 0) + 1 : ((thread as any).turn_away_count ?? 0);
    const terminated = counts && next >= TURN_AWAY_LIMIT;

    const patch: Record<string, any> = { turn_away_count: next };
    if (terminated) {
      Object.assign(patch, {
        status: "terminated",
        termination_reason: "cheating",
        cheating_violation: true,
        overall_score: 0,
        cumulative_score: 0,
        ended_at: new Date().toISOString(),
      });
    }
    const { error } = await context.supabase
      .from("interview_threads").update(patch as any)
      .eq("id", data.threadId).eq("user_id", context.userId);
    if (error) throw error;

    return { count: next, limit: TURN_AWAY_LIMIT, terminated };
  });

/**
 * Ends an interview with a violation. A violation always forces the overall
 * score to 0, overriding any category scores that were already calculated.
 */
export const terminateInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    threadId: z.string().uuid(),
    reason: z.enum(["cheating", "language", "candidate_ended"]),
    detail: z.string().max(1000).optional().default(""),
    transcript: z.string().max(50000).optional().default(""),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await context.supabase.from("monitoring_events").insert({
      thread_id: data.threadId, user_id: context.userId,
      event_type: `terminated:${data.reason}`, detail: data.detail,
    } as any);

    const patch: Record<string, any> = {
      status: "terminated",
      termination_reason: data.reason,
      overall_score: 0,
      cumulative_score: 0,
      ended_at: new Date().toISOString(),
      language_violation: data.reason === "language",
      cheating_violation: data.reason === "cheating",
      recommendation: "No Hire",
    };
    if (data.transcript) patch['transcript'] = data.transcript;

    const { error } = await context.supabase
      .from("interview_threads").update(patch as any)
      .eq("id", data.threadId).eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true, overall: 0, reason: data.reason };
  });

/** Persists the AI's current difficulty decision for the session. */
export const setDifficulty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    threadId: z.string().uuid(),
    difficulty: z.enum(["easy", "medium", "hard", "expert"]),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("interview_threads").update({ difficulty: data.difficulty } as any)
      .eq("id", data.threadId).eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const saveInterviewResults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SaveInterviewSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: thread } = await context.supabase
      .from("interview_threads").select("status")
      .eq("id", data.threadId).eq("user_id", context.userId).maybeSingle();
    // Never resurrect a terminated interview back to "completed".
    const terminated = (thread as any)?.status === "terminated";

    const patch: Record<string, any> = {
      transcript: data.transcript,
      notes: data.notes,
      ended_at: new Date().toISOString(),
    };
    if (!terminated) {
      patch['status'] = "completed";
      patch['termination_reason'] = "completed";
      if (data.competency_scores.length) patch['competency_scores'] = data.competency_scores;
      if (data.cumulative) patch['cumulative_score'] = data.cumulative;
    }

    const { error } = await context.supabase
      .from("interview_threads").update(patch as any)
      .eq("id", data.threadId).eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true, terminated };
  });

export const saveNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ threadId: z.string().uuid(), notes: z.string().max(20000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("interview_threads").update({ notes: data.notes } as any)
      .eq("id", data.threadId).eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const appendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    threadId: z.string().uuid(),
    role: z.enum(["user", "assistant"]),
    content: z.string().max(8000),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
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
