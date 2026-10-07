import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/echosphere";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EchoSphere — Adaptive AI Interviews" },
      {
        name: "description",
        content:
          "Where every answer shapes the next question through adaptive AI voice interviews.",
      },
      { property: "og:title", content: "EchoSphere — Adaptive AI Interviews" },
      {
        property: "og:description",
        content:
          "Where every answer shapes the next question through adaptive AI voice interviews.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});
