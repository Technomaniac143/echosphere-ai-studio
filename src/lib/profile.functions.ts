import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EMAIL_RE, PHONE_RE, GITHUB_REPO_RE, LINKEDIN_RE, URL_RE } from "./validation";

const SIGNED_URL_TTL = 60 * 60 * 24;

const nullableTrimmed = (max: number) =>
  z.string().max(max).nullable().optional().transform(v => (v && v.trim() ? v.trim() : null));

/** Server-side mirror of the browser validation — never trust the client. */
const ProfileSchema = z.object({
  full_name: nullableTrimmed(200),
  email: nullableTrimmed(200).refine(v => !v || EMAIL_RE.test(v), "Please enter a valid email address."),
  phone: nullableTrimmed(20).refine(v => !v || PHONE_RE.test(v), "Phone number must be exactly 10 digits."),
  github_url: nullableTrimmed(500).refine(v => !v || GITHUB_REPO_RE.test(v), "Enter a full GitHub repository URL."),
  linkedin_url: nullableTrimmed(500).refine(v => !v || LINKEDIN_RE.test(v), "Enter a valid LinkedIn profile URL."),
  best_project_url: nullableTrimmed(500).refine(v => !v || URL_RE.test(v), "Enter a valid project URL."),
  experience: nullableTrimmed(2000),
  institution: nullableTrimmed(200),
  degree: nullableTrimmed(200),
  department: nullableTrimmed(200),
  graduation_year: z.union([z.number(), z.string().max(20)]).nullable().optional(),
  certifications: z.array(z.object({
    name: z.string().max(200),
    org: z.string().max(200),
    year: z.string().max(10),
    url: z.string().max(500),
  })).nullable().optional(),
  photo_path: nullableTrimmed(500),
  resume_path: nullableTrimmed(500),
});

export type ProfileInput = z.input<typeof ProfileSchema>;

/** Fields that must be present before a candidate may start an interview. */
const REQUIRED_DB_FIELDS = ["full_name", "email", "phone", "github_url", "institution", "degree", "department", "graduation_year"] as const;

function completionOf(row: Record<string, any>) {
  const filled = REQUIRED_DB_FIELDS.filter(f => {
    const v = row[f];
    return typeof v === "string" ? v.trim().length > 0 : v != null;
  }).length;
  return Math.round((filled / REQUIRED_DB_FIELDS.length) * 100);
}

async function withPhotoUrl(supabase: any, row: any) {
  if (!row) return row;
  let photo_url: string | null = null;
  if (row.photo_path && row.photo_path !== "pending") {
    const { data: signed } = await supabase.storage.from("candidate-photos").createSignedUrl(row.photo_path, SIGNED_URL_TTL);
    photo_url = signed?.signedUrl ?? null;
  }
  return { ...row, photo_url, missing_fields: REQUIRED_DB_FIELDS.filter(f => {
    const v = row[f];
    return typeof v === "string" ? v.trim().length === 0 : v == null;
  }) };
}

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("candidate_profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error && error.code !== "PGRST116") throw error;
    if (!data) return null;
    return withPhotoUrl(context.supabase, data);
  });

export const upsertProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProfileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const rawYear = typeof data.graduation_year === "string"
      ? parseInt(data.graduation_year.replace(/\D/g, "").slice(0, 4), 10)
      : data.graduation_year;
    const graduationYear = typeof rawYear === "number" && Number.isFinite(rawYear) && rawYear >= 1950 && rawYear <= 2100
      ? rawYear
      : null;

    // Merge with what is already stored so a partial save never wipes existing data.
    const { data: existing } = await context.supabase
      .from("candidate_profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();

    const prev = (existing ?? {}) as Record<string, any>;
    const merged: Record<string, any> = {
      user_id: context.userId,
      full_name: data.full_name ?? prev['full_name'] ?? "",
      email: data.email ?? prev['email'] ?? "",
      phone: data.phone ?? prev['phone'] ?? null,
      github_url: data.github_url ?? prev['github_url'] ?? null,
      linkedin_url: data.linkedin_url ?? prev['linkedin_url'] ?? null,
      best_project_url: data.best_project_url ?? prev['best_project_url'] ?? null,
      experience: data.experience ?? prev['experience'] ?? null,
      institution: data.institution ?? prev['institution'] ?? null,
      degree: data.degree ?? prev['degree'] ?? null,
      department: data.department ?? prev['department'] ?? null,
      graduation_year: graduationYear ?? prev['graduation_year'] ?? null,
      certifications: data.certifications ?? prev['certifications'] ?? [],
      resume_path: data.resume_path ?? prev['resume_path'] ?? null,
      ...(data.photo_path && data.photo_path !== "pending" ? { photo_path: data.photo_path } : {}),
    };
    merged['profile_completion'] = completionOf(merged);

    const { data: row, error } = await context.supabase
      .from("candidate_profiles")
      .upsert(merged as any, { onConflict: "user_id" })
      .select()
      .single();
    if (error) throw error;
    return withPhotoUrl(context.supabase, row);
  });

export const uploadPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ base64: z.string(), contentType: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const base64 = data.base64.split(",")[1];
    if (!base64) throw new Error("That image could not be read. Please capture it again.");
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    if (bytes.byteLength > 10 * 1024 * 1024) throw new Error("Photo must be smaller than 10MB.");
    const path = `${context.userId}/photo.jpg`;
    const { error } = await context.supabase.storage
      .from("candidate-photos")
      .upload(path, bytes, { contentType: data.contentType, upsert: true });
    if (error) throw error;

    await context.supabase.from("candidate_profiles").update({ photo_path: path } as any).eq("user_id", context.userId);

    const { data: signed } = await context.supabase.storage.from("candidate-photos").createSignedUrl(path, SIGNED_URL_TTL);
    return { path, url: signed?.signedUrl ?? null };
  });

export const getPhotoUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ path: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: signed } = await context.supabase.storage
      .from("candidate-photos")
      .createSignedUrl(data.path, SIGNED_URL_TTL);
    return signed?.signedUrl ?? null;
  });
