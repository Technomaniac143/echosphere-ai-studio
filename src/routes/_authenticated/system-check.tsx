import { createFileRoute } from "@tanstack/react-router";
import { SystemCheckPage } from "@/components/echosphere";
export const Route = createFileRoute("/_authenticated/system-check")({
  head: () => ({
    meta: [
      { title: "System Check — EchoSphere" },
      { name: "description", content: "Run the interview environment pre-flight checks." },
      { property: "og:title", content: "System Check — EchoSphere" },
      { property: "og:description", content: "Run the interview environment pre-flight checks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SystemCheckPage,
});
