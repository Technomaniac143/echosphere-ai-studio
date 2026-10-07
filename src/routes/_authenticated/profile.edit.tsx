import { createFileRoute } from "@tanstack/react-router";
import { EditProfilePage } from "@/components/echosphere";
export const Route = createFileRoute("/_authenticated/profile/edit")({
  head: () => ({
    meta: [
      { title: "Edit Profile — EchoSphere" },
      {
        name: "description",
        content:
          "Add your resume, project repository, education and certifications before an interview.",
      },
      { property: "og:title", content: "Edit Profile — EchoSphere" },
      {
        property: "og:description",
        content:
          "Add your resume, project repository, education and certifications before an interview.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditProfilePage,
});
