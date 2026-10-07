import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/echosphere";
export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Candidate Dashboard — EchoSphere" },
      {
        name: "description",
        content: "Review interviews, competencies, reports, and your roadmap.",
      },
      { property: "og:title", content: "Candidate Dashboard — EchoSphere" },
      {
        property: "og:description",
        content: "Review interviews, competencies, reports, and your roadmap.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});
