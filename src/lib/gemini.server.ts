/**
 * Small server-only helper around the Gemini generateContent endpoint.
 * Falls back across model ids so a retired preview model does not break scoring.
 */
const FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-3.8-flash", "gemini-2.5-pro"];

export async function generateJson(
  prompt: string,
  opts: { temperature?: number } = {},
): Promise<any> {
  const key = process.env["GEMINI_API_KEY"];
  if (!key)
    throw new Error("The AI service is not configured. Add a Gemini API key to enable scoring.");

  const configured = process.env["GEMINI_MODEL"];
  const models = [configured, ...FALLBACK_MODELS]
    .filter(Boolean)
    .filter((m, i, a) => a.indexOf(m) === i) as string[];

  let lastError = "";
  for (const model of models) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
          },
        }),
      },
    );
    if (res.status === 404 || res.status === 400) {
      lastError = `${res.status} ${await res.text().catch(() => "")}`;
      continue; // try the next model id
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 401 || res.status === 403)
        throw new Error("The AI service rejected the configured API key.");
      if (res.status === 429)
        throw new Error("The AI service is rate limited right now. Please try again in a moment.");
      throw new Error(`AI request failed: ${res.status} ${text.slice(0, 200)}`);
    }
    const json = await res.json();
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error("The AI service returned an empty response.");
    try {
      return JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error("The AI service returned a response that could not be read.");
    }
  }
  throw new Error(`No usable AI model available. Last error: ${lastError.slice(0, 200)}`);
}

export function clampScore(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}
