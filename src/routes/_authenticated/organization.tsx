import { createFileRoute } from "@tanstack/react-router";
import { OrganizationPage } from "@/components/echosphere/organization";

export const Route = createFileRoute("/_authenticated/organization")({
  head: () => ({
    meta: [
      { title: "Organization Workspace — EchoSphere" },
      { name: "description", content: "Rank real candidates by interview performance and upload your own interview patterns." },
      { property: "og:title", content: "Organization Workspace — EchoSphere" },
      { property: "og:description", content: "Rank real candidates by interview performance and upload your own interview patterns." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrganizationPage,
});
