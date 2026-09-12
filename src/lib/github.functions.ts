import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseGithubRepo, GITHUB_REPO_RE } from "./validation";
import { generateJson } from "./gemini.server";

export type GithubAnalysis = {
  repo: string;
  description: string;
  languages: string[];
  topics: string[];
  technologies: string[];
  features: string[];
  architecture: string;
  summary: string;
  questions: string[];
  analyzed_at: string;
};

const GH_HEADERS = { Accept: "application/vnd.github+json", "User-Agent": "EchoSphere-Interview-Platform" };

async function gh(path: string) {
  const res = await fetch(`https://api.github.com${path}`, { headers: GH_HEADERS });
  return { ok: res.ok, status: res.status, body: res.ok ? await res.json() : null };
}

/**
 * Reads a public GitHub repository and derives interview-ready project context
 * plus questions that are specific to what the repository actually contains.
 */
export const analyzeGithubProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    url: z.string().max(500).refine(v => GITHUB_REPO_RE.test(v.trim()), "Enter a full GitHub repository URL."),
    threadId: z.string().uuid().optional(),
  }).parse(input))
  .handler(async ({ data, context }): Promise<GithubAnalysis> => {
    const parsed = parseGithubRepo(data.url);
    if (!parsed) throw new Error("That does not look like a GitHub repository link.");
    const { owner, repo } = parsed;

    const meta = await gh(`/repos/${owner}/${repo}`);
    if (meta.status === 404) throw new Error("That repository could not be found. It may be private or the link may be wrong.");
    if (meta.status === 403) throw new Error("GitHub is rate limiting requests right now. Please try again in a few minutes.");
    if (!meta.ok) throw new Error("GitHub could not be reached. Please try again.");

    const [langRes, treeRes, readmeRes] = await Promise.all([
      gh(`/repos/${owner}/${repo}/languages`),
      gh(`/repos/${owner}/${repo}/git/trees/${meta.body.default_branch}?recursive=1`),
      fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers: { ...GH_HEADERS, Accept: "application/vnd.github.raw" } })
        .then(r => (r.ok ? r.text() : "")).catch(() => ""),
    ]);

    const languages = Object.keys(langRes.body ?? {});
    const files: string[] = Array.isArray(treeRes.body?.tree)
      ? treeRes.body.tree.filter((t: any) => t.type === "blob").map((t: any) => t.path).slice(0, 400)
      : [];
    const readme = (readmeRes as string).slice(0, 8000);

    const prompt = `You are preparing a technical interview. Analyse this real GitHub repository and return JSON only.

Repository: ${owner}/${repo}
Description: ${meta.body.description ?? "(none)"}
Topics: ${(meta.body.topics ?? []).join(", ") || "(none)"}
Primary languages: ${languages.join(", ") || "(unknown)"}
Stars: ${meta.body.stargazers_count} | Default branch: ${meta.body.default_branch}

File paths (truncated):
${files.join("\n").slice(0, 6000)}

README (truncated):
"""${readme}"""

Return this exact JSON shape:
{
  "technologies": ["frameworks, libraries, databases and services you can actually see evidence for"],
  "features": ["3-6 concrete features this project implements"],
  "architecture": "2-3 sentences describing how the project is structured",
  "summary": "3-4 sentence summary an interviewer can read before the call",
  "questions": ["4-6 interview questions that could ONLY be asked about THIS repository - reference its real files, stack and decisions"]
}

Rules: never invent a technology, feature or file that is not evidenced above. If something is unclear, leave it out.`;

    const ai = await generateJson(prompt, { temperature: 0.4 });

    const analysis: GithubAnalysis = {
      repo: `${owner}/${repo}`,
      description: meta.body.description ?? "",
      languages,
      topics: meta.body.topics ?? [],
      technologies: Array.isArray(ai.technologies) ? ai.technologies.slice(0, 20) : [],
      features: Array.isArray(ai.features) ? ai.features.slice(0, 10) : [],
      architecture: typeof ai.architecture === "string" ? ai.architecture : "",
      summary: typeof ai.summary === "string" ? ai.summary : "",
      questions: Array.isArray(ai.questions) ? ai.questions.slice(0, 8) : [],
      analyzed_at: new Date().toISOString(),
    };

    await context.supabase
      .from("candidate_profiles")
      .update({ github_analysis: analysis } as any)
      .eq("user_id", context.userId);

    if (data.threadId) {
      await context.supabase
        .from("interview_threads")
        .update({ github_context: analysis } as any)
        .eq("id", data.threadId)
        .eq("user_id", context.userId);
    }

    return analysis;
  });

/** Returns the stored analysis without hitting GitHub again. */
export const getGithubAnalysis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("candidate_profiles")
      .select("github_url, github_analysis")
      .eq("user_id", context.userId)
      .maybeSingle();
    return (data ?? null) as { github_url: string | null; github_analysis: GithubAnalysis | null } | null;
  });
