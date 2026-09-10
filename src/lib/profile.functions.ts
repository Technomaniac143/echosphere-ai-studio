import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ProfileSchema = z.object({
  full_name: z.string().max(200).nullable().optional(),
  email: z.string().email().max(200).nullable().optional(),
  github_url: z.string().max(500).nullable().optional(),
  institution: z.string().max(200).nullable().optional(),
  degree: z.string().max(200).nullable().optional(),
  department: z.string().max(200).nullable().optional(),
  graduation_year: z.union([z.number(), z.string().max(20)]).nullable().optional(),
  certifications: z.array(z.object({
    name: z.string().max(200),
    org: z.string().max(200),
    year: z.string().max(10),
    url: z.string().max(500),
  })).nullable().optional(),
  photo_path: z.string().max(500).nullable().optional(),
});

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("candidate_profiles")
      .select("*")
      .eq("user_id", context.userId)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  });

export const upsertProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProfileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const certifications = data.certifications ?? [];
    const completion = computeCompletion(data);
    const rawYear = typeof data.graduation_year === "string"
      ? parseInt(data.graduation_year.replace(/\D/g, "").slice(0, 4), 10)
      : data.graduation_year;
    const graduationYear = typeof rawYear === "number" && Number.isFinite(rawYear) && rawYear >= 1950 && rawYear <= 2100
      ? rawYear
      : null;

    const { data: row, error } = await context.supabase
      .from("candidate_profiles")
      .upsert({
        user_id: context.userId,
        full_name: data.full_name ?? "",
        email: data.email ?? "",
        github_url: data.github_url ?? null,
        institution: data.institution ?? null,
        degree: data.degree ?? null,
        department: data.department ?? null,
        graduation_year: graduationYear,
        certifications,
        ...(data.photo_path ? { photo_path: data.photo_path } : {}),
        profile_completion: completion,
      } as any, { onConflict: "user_id" })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const uploadPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ base64: z.string(), contentType: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const base64 = data.base64.split(",")[1];
    if (!base64) throw new Error("Invalid image data");
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const path = `${context.userId}/photo.jpg`;
    const { error } = await context.supabase.storage
      .from("candidate-photos")
      .upload(path, bytes, { contentType: data.contentType, upsert: true });
    if (error) throw error;

    const { error: updateError } = await context.supabase
      .from("candidate_profiles")
      .update({ photo_path: path } as any)
      .eq("user_id", context.userId);
    if (updateError) throw updateError;

    const { data: urlData } = context.supabase.storage.from("candidate-photos").getPublicUrl(path);
    return { path, url: urlData?.publicUrl ?? null };
  });

export const getPhotoUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ path: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: signed } = await context.supabase.storage
      .from("candidate-photos")
      .createSignedUrl(data.path, 60 * 60 * 24);
    return signed?.signedUrl ?? null;
  });

function computeCompletion(data: z.infer<typeof ProfileSchema>) {
  const fields = [data.full_name, data.github_url, data.institution, data.degree, data.department, data.graduation_year];
  const filled = fields.filter((f) => typeof f === "string" ? f.trim().length > 0 : f != null).length;
  return Math.round((filled / fields.length) * 100);
}
