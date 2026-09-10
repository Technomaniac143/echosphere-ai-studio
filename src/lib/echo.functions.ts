import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EchoSchema = z.object({
  message: z.string().min(1).max(2000),
  threadId: z.string().uuid().optional(),
});

export const askEcho = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EchoSchema.parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env['GEMINI_API_KEY'];
    if (!key) throw new Error("Gemini API key is not configured");

    const tools: Record<string, () => Promise<string>> = {
      get_latest_interview_scores: async () => {
        const { data: rows, error } = await context.supabase
          .from("interview_threads")
          .select("company, role, cumulative_score, competency_scores, created_at")
          .eq("user_id", context.userId)
          .order("created_at", { ascending: false })
          .limit(1);
        if (error || !rows || rows.length === 0) return "No interviews found yet.";
        const row = rows[0] as any;
        const comps = Array.isArray(row.competency_scores)
          ? row.competency_scores.map((c: any) => `${c.name}: ${c.score}`).join(", ")
          : "N/A";
        return `Latest interview: ${row.company} (${row.role}) — overall ${row.cumulative_score}. Competencies: ${comps}.`;
      },
      list_interviews: async () => {
        const { data: rows, error } = await context.supabase
          .from("interview_threads")
          .select("company, role, cumulative_score, created_at")
          .eq("user_id", context.userId)
          .order("created_at", { ascending: false })
          .limit(10);
        if (error || !rows || rows.length === 0) return "No interviews found yet.";
        return rows.map((r: any) => `- ${r.company} ${r.role}: ${r.cumulative_score}`).join("\n");
      },
    };

    const system = `You are Echo, the friendly AI assistant inside EchoSphere, a mock interview platform. Help the candidate with their interviews, profile, scores, and platform navigation. If the user asks about their latest scores or interviews, call the appropriate function. Available functions: ${Object.keys(tools).join(", ")}.`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: system }] },
          { role: "user", parts: [{ text: data.message }] },
        ],
        tools: [{
          functionDeclarations: Object.keys(tools).map(name => ({
            name,
            description: name === "get_latest_interview_scores"
              ? "Fetch the user's most recent interview overall and competency scores."
              : "List the user's recent interviews with overall scores.",
            parameters: { type: "object", properties: {} },
          })),
        }],
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Echo failed: ${res.status} ${text}`);
    }
    const json = await res.json();
    const call = json.candidates?.[0]?.content?.parts?.[0]?.functionCall;
    if (call && tools[call.name]) {
      const result = await tools[call.name]!();
      const followUp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: system }] },
            { role: "user", parts: [{ text: data.message }] },
            { role: "model", parts: [{ functionCall: call }] },
            { role: "user", parts: [{ text: `Function result: ${result}` }] },
          ],
        }),
      });
      const followJson = await followUp.json();
      const text = followJson.candidates?.[0]?.content?.parts?.[0]?.text ?? "I found that information for you.";
      return { reply: text };
    }
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "I'm here to help.";
    return { reply: text };
  });
