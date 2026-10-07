import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        return { user: data.user };
      }
    } catch (e) {
      console.warn("Supabase auth check failed, checking demo fallback", e);
    }

    if (typeof window !== "undefined") {
      const isDemo = localStorage.getItem("echosphere_demo_user") === "true";
      if (isDemo) {
        return { user: { id: "demo-user-id", email: "candidate@echosphere.ai" } };
      }
    }

    throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
