import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ScoreSchema = z.object({
  threadId: z.string().uuid(),
  transcript: z.string().min(1).max(50000),
});

export const scoreInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ScoreSchema.parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env['GEMINI_API_KEY'];
    if (!key) throw new Error("Gemini API key is not configured");

    const prompt = `You are an expert technical interviewer. Evaluate the following mock interview transcript and return a JSON object with this exact shape:
{
  "overall": number 0-100,
  "justification": "short paragraph",
  "strengths": ["3-4 concise strengths"],
  "improvements": ["3-4 concise improvements"],
  "recommendation": "Strong Hire | Hire | Needs practice",
  "panel_scores": [
    { "name": "Alex", "role": "Technical Interviewer", "score": number 0-100 },
    { "name": "Maya", "role": "Product Manager", "score": number 0-100 },
    { "name": "Daniel", "role": "Hiring Manager", "score": number 0-100 }
  ],
  "competencies": [
    { "name": "Communication", "score": number 0-100, "note": "one sentence" },
    { "name": "Technical Depth", "score": number 0-100, "note": "one sentence" },
    { "name": "Problem Solving", "score": number 0-100, "note": "one sentence" },
    { "name": "Product Thinking", "score": number 0-100, "note": "one sentence" },
    { "name": "Leadership", "score": number 0-100, "note": "one sentence" },
    { "name": "Adaptability", "score": number 0-100, "note": "one sentence" }
  ]
}

Transcript:
"""${data.transcript}"""`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Gemini scoring failed: ${res.status} ${text}`);
    }
    const json = await res.json();
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error("Gemini returned no scoring content");
    const parsed = JSON.parse(raw);

    const competencies = parsed.competencies ?? [];
    const overall = Math.round(parsed.overall ?? 0);
    const strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
    const improvements = Array.isArray(parsed.improvements) ? parsed.improvements : [];
    const recommendation = typeof parsed.recommendation === "string" ? parsed.recommendation : (overall >= 80 ? "Strong Hire" : overall >= 70 ? "Hire" : "Needs practice");
    const panelScores = Array.isArray(parsed.panel_scores) ? parsed.panel_scores : [];

    const { error } = await context.supabase
      .from("interview_threads")
      .update({
        overall_score: overall,
        cumulative_score: overall,
        competency_scores: competencies,
        strengths,
        improvements,
        recommendation,
        panel_scores: panelScores,
      } as any)
      .eq("id", data.threadId)
      .eq("user_id", context.userId);
    if (error) throw error;

    return { overall, justification: parsed.justification ?? "", competencies, strengths, improvements, recommendation, panelScores };
  });
