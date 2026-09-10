import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/public/schema-check")({
  server: {
    handlers: {
      GET: async () => {
        const supabase = createClient(
          process.env['SUPABASE_URL']!,
          process.env['SUPABASE_SERVICE_ROLE_KEY']!,
          { auth: { persistSession: false } }
        );
        const { data, error } = await supabase
          .from("candidate_profiles")
          .select("photo_path")
          .limit(1);
        if (error) return Response.json({ ok: false, error: error.message, code: error.code });
        return Response.json({ ok: true, data });
      },
    },
  },
});
