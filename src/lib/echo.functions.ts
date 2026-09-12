import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateJson } from "./gemini.server";
import { CATEGORY_LABELS, CATEGORIES } from "./scoring.functions";

/** Routes Echo is allowed to send the user to. */
export const ECHO_ROUTES: Record<string, string> = {
  dashboard: "/dashboard",
  profile: "/profile",
  "edit profile": "/profile/edit",
  reports: "/report",
  report: "/report",
  roadmap: "/roadmap",
  setup: "/setup",
  "system check": "/system-check",
  analysis: "/analysis",
  organization: "/org/dashboard",
  home: "/",
};

/**
 * Echo answers questions about the signed-in candidate's own real data and can
 * suggest a page to open. It is read-only: it never changes stored records.
 */
export const askEcho = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    question: z.string().min(1).max(1000),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const [{ data: profile }, { data: threads }, { data: roadmap }] = await Promise.all([
      context.supabase.from("candidate_profiles").select("full_name, email, institution, degree, department, graduation_year, github_url, profile_completion").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("interview_threads")
        .select("id, company, role, domain, status, created_at, overall_score, technical_score, behavioral_score, product_manager_score, hiring_manager_score, strengths, improvements, recommendation, termination_reason")
        .eq("user_id", context.userId).order("created_at", { ascending: false }).limit(15),
      context.supabase.from("roadmap_progress").select("title, dimension, status, weeks").eq("user_id", context.userId).order("order_index"),
    ]);

    const interviews = ((threads ?? []) as any[]).map(t => ({
      id: t.id,
      when: new Date(t.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      company: t.company, role: t.role, domain: t.domain, status: t.status,
      overall: t.overall_score,
      scores: Object.fromEntries(CATEGORIES.map(c => [CATEGORY_LABELS[c], t[`${c === "product_manager" ? "product_manager" : c}_score`]])),
      recommendation: t.recommendation,
      terminated: t.termination_reason,
      strengths: t.strengths, improvements: t.improvements,
    }));

    const ai = await generateJson(`You are "Echo", the assistant inside the EchoSphere interview platform. Answer the user using ONLY the data below. Never invent scores, dates or facts. If the data does not contain the answer, say so plainly and suggest what they could do next.

Keep the reply under 70 words, warm and direct, written to be spoken aloud.

If the user is asking to go somewhere ("open my roadmap", "take me to reports"), set "navigate" to one of:
${Object.values(ECHO_ROUTES).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
Otherwise set "navigate" to null.

Return JSON: { "reply": string, "navigate": string|null }

CANDIDATE PROFILE: ${JSON.stringify(profile ?? {})}
INTERVIEWS (newest first): ${JSON.stringify(interviews)}
ROADMAP: ${JSON.stringify(roadmap ?? [])}

USER: "${data.question}"`, { temperature: 0.3 });

    const allowed = new Set(Object.values(ECHO_ROUTES));
    const navigate = typeof ai?.navigate === "string" && allowed.has(ai.navigate) ? ai.navigate : null;

    return {
      reply: typeof ai?.reply === "string" && ai.reply.trim() ? ai.reply.trim() : "I couldn't find anything on that yet.",
      navigate,
    };
  });
