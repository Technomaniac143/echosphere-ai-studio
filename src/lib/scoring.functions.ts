import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateJson, clampScore } from "./gemini.server";

export const CATEGORIES = ["technical", "behavioral", "product_manager", "hiring_manager"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  product_manager: "Product Manager",
  hiring_manager: "Hiring Manager",
};

/** Overall = equally weighted mean of the four category scores. */
export function computeOverall(scores: Record<Category, number>): number {
  const values = CATEGORIES.map((c) => scores[c]);
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

const CATEGORY_JSON = CATEGORIES.map(
  (c) =>
    `    "${c}": { "score": number 0-100, "evidence": ["2-4 specific observations quoted or paraphrased from the transcript"] }`,
).join(",\n");

export const scoreInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        threadId: z.string().uuid(),
        transcript: z.string().max(50000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: thread, error: readError } = await context.supabase
      .from("interview_threads")
      .select(
        "status, termination_reason, turn_away_count, language_violation, cheating_violation, github_context, role, company, domain",
      )
      .eq("id", data.threadId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (readError) throw readError;
    if (!thread) throw new Error("Interview not found.");
    const t = thread as any;

    const violation: string | null =
      t.status === "terminated" ? (t.termination_reason ?? "cheating") : null;

    const transcript = data.transcript.trim();
    if (!transcript && !violation) {
      throw new Error("There is no conversation to score yet.");
    }

    let ai: any = {
      categories: Object.fromEntries(CATEGORIES.map((c) => [c, { score: 0, evidence: [] }])),
      lost_points: [],
      strengths: [],
      improvements: [],
      summary: "",
      recommendation: "No Hire",
      difficulty_trajectory: "medium",
    };

    if (transcript) {
      const prompt = `You are the evaluation panel for a mock interview. Score the candidate strictly from the transcript evidence below. Never invent evidence.

Role: ${t.role} at ${t.company} (${t.domain})
${t.github_context ? `The candidate's project (${t.github_context.repo}): ${t.github_context.summary}` : ""}

Return JSON in exactly this shape:
{
  "categories": {
${CATEGORY_JSON}
  },
  "lost_points": [
    { "category": "technical|behavioral|product_manager|hiring_manager", "issue": "short label", "detail": "what specifically cost marks, referencing the transcript", "points": number }
  ],
  "strengths": ["3-4 concise strengths grounded in the transcript"],
  "improvements": ["3-4 concise, actionable improvements"],
  "summary": "one short paragraph summarising the interview",
  "recommendation": "Strong Hire | Hire | Lean Hire | Needs practice | No Hire",
  "difficulty_trajectory": "easy | medium | hard | expert"
}

Rules:
- Score each of the four categories independently. Do not give them the same number unless the evidence genuinely supports it.
- If a category was barely covered in the transcript, score it low and say so in the evidence rather than guessing.
- "lost_points" must explain real deductions from this transcript. Never write generic filler.

Transcript:
"""${transcript}"""`;

      ai = await generateJson(prompt, { temperature: 0.2 });
    }

    const categoryScores = Object.fromEntries(
      CATEGORIES.map((c) => [c, clampScore(ai?.categories?.[c]?.score)]),
    ) as Record<(typeof CATEGORIES)[number], number>;

    const evidence = CATEGORIES.map((c) => ({
      category: c,
      label: CATEGORY_LABELS[c],
      score: categoryScores[c],
      evidence: Array.isArray(ai?.categories?.[c]?.evidence)
        ? ai.categories[c].evidence.slice(0, 6)
        : [],
    }));

    const lostPoints = Array.isArray(ai?.lost_points)
      ? ai.lost_points.slice(0, 12).map((l: any) => ({
          category: typeof l?.category === "string" ? l.category : "general",
          issue: String(l?.issue ?? "").slice(0, 160),
          detail: String(l?.detail ?? "").slice(0, 600),
          points: Number.isFinite(Number(l?.points))
            ? Math.max(0, Math.round(Number(l.points)))
            : 0,
        }))
      : [];

    const calculatedOverall = computeOverall(categoryScores);

    // A violation-based zero always overrides the calculated overall score.
    const overall = violation && violation !== "completed" ? 0 : calculatedOverall;

    if (violation && violation !== "completed") {
      const reasonText =
        violation === "cheating"
          ? `Interview terminated after ${t.turn_away_count ?? 3} monitoring violations (looking away from the camera).`
          : violation === "language"
            ? "Interview terminated because inappropriate language was detected."
            : "Interview ended early by the candidate.";
      lostPoints.unshift({
        category: "general",
        issue: "Interview terminated",
        detail: `${reasonText} Under the scoring policy this sets the overall score to 0, regardless of the category scores earned before termination.`,
        points: calculatedOverall,
      });
    }

    const competencies = evidence.map((e) => ({
      name: e.label,
      score: e.score,
      note: e.evidence[0] ?? "",
    }));

    const patch: Record<string, any> = {
      technical_score: categoryScores.technical,
      behavioral_score: categoryScores.behavioral,
      product_manager_score: categoryScores.product_manager,
      hiring_manager_score: categoryScores.hiring_manager,
      overall_score: overall,
      cumulative_score: overall,
      competency_scores: competencies,
      evidence,
      lost_points: lostPoints,
      strengths: Array.isArray(ai?.strengths) ? ai.strengths.slice(0, 6) : [],
      improvements: Array.isArray(ai?.improvements) ? ai.improvements.slice(0, 6) : [],
      recommendation:
        violation && violation !== "completed"
          ? "No Hire — interview terminated"
          : typeof ai?.recommendation === "string"
            ? ai.recommendation
            : "Needs practice",
      panel_scores: [
        { name: "Alex", role: "Technical Interviewer", score: categoryScores.technical },
        { name: "Sophia", role: "Behavioral Interviewer", score: categoryScores.behavioral },
        { name: "Maya", role: "Product Manager", score: categoryScores.product_manager },
        { name: "Daniel", role: "Hiring Manager", score: categoryScores.hiring_manager },
      ],
      notes: typeof ai?.summary === "string" ? ai.summary : undefined,
    };
    if (patch["notes"] === undefined) delete patch["notes"];

    const { error } = await context.supabase
      .from("interview_threads")
      .update(patch as any)
      .eq("id", data.threadId)
      .eq("user_id", context.userId);
    if (error) throw error;

    return {
      overall,
      calculatedOverall,
      categories: categoryScores,
      evidence,
      lostPoints,
      strengths: patch["strengths"],
      improvements: patch["improvements"],
      recommendation: patch["recommendation"],
      summary: ai?.summary ?? "",
      violation,
    };
  });

/**
 * Asks the AI whether the next question should get easier, stay the same or get
 * harder, based on how the candidate has answered so far.
 */
export const adaptDifficulty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        threadId: z.string().uuid(),
        transcript: z.string().max(20000),
        current: z.enum(["easy", "medium", "hard", "expert"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const ai = await generateJson(
      `You are calibrating a live interview. The current difficulty is "${data.current}".
Judge the candidate's recent answers on correctness, depth, reasoning, confidence and response quality.

Return JSON: { "next": "easy|medium|hard|expert", "direction": "easier|same|harder", "reason": "one short sentence" }

Recent conversation:
"""${data.transcript.slice(-8000)}"""`,
      { temperature: 0.1 },
    );

    const allowed = ["easy", "medium", "hard", "expert"];
    const next = allowed.includes(ai?.next) ? ai.next : data.current;

    await context.supabase
      .from("interview_threads")
      .update({ difficulty: next } as any)
      .eq("id", data.threadId)
      .eq("user_id", context.userId);

    return { next, direction: ai?.direction ?? "same", reason: ai?.reason ?? "" };
  });

/**
 * Language moderation for candidate speech. Deliberately conservative: only
 * genuinely abusive or offensive speech counts as a violation.
 */
export const moderateSpeech = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        threadId: z.string().uuid(),
        text: z.string().min(1).max(4000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const ai = await generateJson(
      `You moderate a professional interview. Decide whether the candidate's utterance below is genuinely abusive, offensive, harassing or seriously unprofessional.

Do NOT flag: hesitation ("um", "hmm"), frustration with a problem, professional disagreement, casual but polite speech, or mild slang.
DO flag: slurs, sexual harassment, threats, insults aimed at a person, or repeated profanity directed at someone.

Return JSON: { "violation": boolean, "severity": "none|mild|severe", "reason": "one short sentence" }

Utterance: """${data.text}"""`,
      { temperature: 0 },
    );

    const violation = ai?.violation === true && ai?.severity === "severe";

    if (violation) {
      await context.supabase.from("monitoring_events").insert({
        thread_id: data.threadId,
        user_id: context.userId,
        event_type: "language-violation",
        detail: String(ai?.reason ?? "").slice(0, 400),
      } as any);
      await context.supabase
        .from("interview_threads")
        .update({
          status: "terminated",
          termination_reason: "language",
          language_violation: true,
          overall_score: 0,
          cumulative_score: 0,
          ended_at: new Date().toISOString(),
        } as any)
        .eq("id", data.threadId)
        .eq("user_id", context.userId);
    }

    return { violation, severity: ai?.severity ?? "none", reason: ai?.reason ?? "" };
  });
