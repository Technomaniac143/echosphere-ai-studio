import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EMAIL_RE, URL_RE } from "./validation";

export const createOrganization = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().min(2, "Organization name is required.").max(200),
        email: z
          .string()
          .refine((v) => EMAIL_RE.test(v.trim()), "Please enter a valid work email address."),
        website: z
          .string()
          .max(300)
          .optional()
          .default("")
          .refine((v) => !v.trim() || URL_RE.test(v.trim()), "Enter a valid website URL."),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // Caller is verified by requireSupabaseAuth; ownership comes from context.userId.
    // Use the privileged client so RLS can't block the atomic org + membership create.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) return { organizationId: (existing as any).organization_id, created: false };

    const { data: org, error } = await supabaseAdmin
      .from("organizations")
      .insert({
        name: data.name.trim(),
        email: data.email.trim(),
        website: data.website.trim() || null,
      } as any)
      .select()
      .single();
    if (error) throw error;

    const { error: memberError } = await supabaseAdmin
      .from("organization_members")
      .insert({ organization_id: (org as any).id, user_id: context.userId, role: "owner" } as any);
    if (memberError) throw memberError;

    return { organizationId: (org as any).id, created: true };
  });

export const getMyOrganization = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: member } = await context.supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!member) return null;
    const { data: org } = await context.supabase
      .from("organizations")
      .select("*")
      .eq("id", (member as any).organization_id)
      .maybeSingle();
    if (!org) return null;
    return { ...(org as any), role: (member as any).role };
  });

/** Candidates ranked by their best real interview score. No mock rows. */
export const listRankedCandidates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: member } = await context.supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!member) throw new Error("You are not part of an organization yet.");

    const [{ data: profiles }, { data: threads }] = await Promise.all([
      context.supabase
        .from("candidate_profiles")
        .select(
          "user_id, full_name, email, institution, degree, department, graduation_year, github_url, linkedin_url, best_project_url, experience",
        ),
      context.supabase
        .from("interview_threads")
        .select(
          "user_id, overall_score, technical_score, behavioral_score, product_manager_score, hiring_manager_score, status, termination_reason, created_at, role, company",
        ),
    ]);

    const byUser = new Map<string, any[]>();
    for (const t of (threads ?? []) as any[]) {
      if (!byUser.has(t.user_id)) byUser.set(t.user_id, []);
      byUser.get(t.user_id)!.push(t);
    }

    const rows = ((profiles ?? []) as any[]).map((p) => {
      const list = (byUser.get(p.user_id) ?? []).filter((t) => t.overall_score != null);
      const best = list.reduce<any>(
        (acc, t) => (acc == null || t.overall_score > acc.overall_score ? t : acc),
        null,
      );
      const avg = list.length
        ? Math.round(list.reduce((a, t) => a + (t.overall_score ?? 0), 0) / list.length)
        : null;
      return {
        userId: p.user_id,
        name: p.full_name || p.email || "Candidate",
        email: p.email,
        institution: p.institution,
        degree: p.degree,
        department: p.department,
        graduationYear: p.graduation_year,
        github: p.github_url,
        linkedin: p.linkedin_url,
        project: p.best_project_url,
        experience: p.experience,
        interviews: list.length,
        bestScore: best?.overall_score ?? null,
        averageScore: avg,
        technical: best?.technical_score ?? null,
        behavioral: best?.behavioral_score ?? null,
        productManager: best?.product_manager_score ?? null,
        hiringManager: best?.hiring_manager_score ?? null,
        lastRole: best?.role ?? null,
        lastCompany: best?.company ?? null,
        terminated: best?.status === "terminated",
      };
    });

    rows.sort((a, b) => (b.bestScore ?? -1) - (a.bestScore ?? -1));
    return rows;
  });

export const uploadInterviewPattern = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string().min(1, "Give the pattern a title.").max(200),
        content: z.string().min(1, "Paste or upload the interview pattern.").max(200000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: member } = await context.supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!member) throw new Error("You are not part of an organization yet.");

    const { data: row, error } = await context.supabase
      .from("interview_patterns")
      .insert({
        organization_id: (member as any).organization_id,
        uploaded_by: context.userId,
        title: data.title.trim(),
        content: data.content,
      } as any)
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const listInterviewPatterns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("interview_patterns")
      .select("id, title, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });
