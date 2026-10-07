import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/echosphere";
export const Route = createFileRoute("/_authenticated/profile/")({
  head: () => ({
    meta: [
      { title: "Candidate Profile — EchoSphere" },
      {
        name: "description",
        content: "Your portfolio: cumulative score, interview history and competency breakdown.",
      },
      { property: "og:title", content: "Candidate Profile — EchoSphere" },
      {
        property: "og:description",
        content: "Your portfolio: cumulative score, interview history and competency breakdown.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});
