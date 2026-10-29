import { createFileRoute } from "@tanstack/react-router";
import { Site } from "@/components/site/Site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Muhammed Mishal: AI / ML Engineer, Kollam" },
      { name: "description", content: "AI/ML engineer and backend developer from Kerala building vision and retrieval systems that run in production." },
      { property: "og:title", content: "Muhammed Mishal: AI / ML Engineer" },
      { property: "og:description", content: "Vision, RAG and backend systems that run in production." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Site,
});
