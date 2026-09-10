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

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
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

    const { error } = await (context.supabase as any)
      .from("interview_threads")
      .update({
        cumulative_score: overall,
        competency_scores: competencies,
      } as any)
      .eq("id", data.threadId)
      .eq("user_id", context.userId);
    if (error) throw error;

    return { overall, justification: parsed.justification ?? "", competencies };
  });
