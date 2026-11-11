import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, lazy, Suspense } from "react";

const DesktopSite = lazy(() =>
  import("@/components/site/Site").then((m) => ({ default: m.Site })),
);
const MobileSite = lazy(() =>
  import("@/components/mobile/MobileSite").then((m) => ({ default: m.MobileSite })),
);

const MOBILE_QUERY = "(max-width: 820px), (pointer: coarse) and (max-width: 1024px)";

function App() {
  const [mode, setMode] = useState<"desktop" | "mobile" | "pending">("pending");

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const update = () => setMode(mql.matches ? "mobile" : "desktop");
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  if (mode === "mobile") {
    return (
      <Suspense fallback={null}>
        <MobileSite />
      </Suspense>
    );
  }

  if (mode === "desktop") {
    return (
      <Suspense fallback={null}>
        <DesktopSite />
      </Suspense>
    );
  }

  return null;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Muhammed Mishal: AI / ML Engineer, Kollam" },
      {
        name: "description",
        content:
          "AI/ML engineer and backend developer from Kerala building vision and retrieval systems that run in production.",
      },
      { property: "og:title", content: "Muhammed Mishal: AI / ML Engineer, Kollam" },
      { name: "twitter:title", content: "Muhammed Mishal: AI / ML Engineer, Kollam" },
      {
        property: "og:description",
        content: "Vision, RAG and backend systems that run in production.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});
