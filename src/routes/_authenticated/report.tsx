import { createFileRoute } from "@tanstack/react-router";
import { ReportPage } from "@/components/echosphere";
import { z } from "zod";
export const Route = createFileRoute("/_authenticated/report")({
  validateSearch: z.object({ threadId: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Interview Report — EchoSphere" },
      {
        name: "description",
        content: "Evidence-backed interview scores, panel perspectives, and improvement roadmap.",
      },
      { property: "og:title", content: "Interview Report — EchoSphere" },
      {
        property: "og:description",
        content: "Evidence-backed interview scores, panel perspectives, and improvement roadmap.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportPage,
});
