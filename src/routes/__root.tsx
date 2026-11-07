import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportError } from "../lib/error-reporting";
import { DevPerfOverlay } from "@/components/site/DevPerfOverlay";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Muhammed Mishal — AI / ML Engineer" },
      { name: "description", content: "Portfolio of Muhammed Mishal, AI/ML engineer building computer vision diagnostics, multimodal systems, and agent pipelines." },
      { name: "author", content: "Muhammed Mishal" },
      // Open Graph
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Muhammed Mishal" },
      { property: "og:url", content: "https://mishal.dev/" },
      { property: "og:title", content: "Muhammed Mishal — AI / ML Engineer" },
      { property: "og:description", content: "Portfolio of Muhammed Mishal, AI/ML engineer building computer vision diagnostics, multimodal systems, and agent pipelines." },
      { property: "og:image", content: "https://mishal.dev/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Muhammed Mishal — AI / ML Engineer" },
      // Twitter Card
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Muhammed Mishal — AI / ML Engineer" },
      { name: "twitter:description", content: "Portfolio of Muhammed Mishal, AI/ML engineer building computer vision diagnostics, multimodal systems, and agent pipelines." },
      { name: "twitter:image", content: "https://mishal.dev/og-image.png" },
      { name: "twitter:image:alt", content: "Muhammed Mishal — AI / ML Engineer" },
    ],
    links: [
      { rel: "canonical", href: "https://mishal.dev/" },
      { rel: "preload", as: "image", href: "/hero/poster.webp", type: "image/webp" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Anton&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@400;500;600;700&display=swap" },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Muhammed Mishal",
  jobTitle: "AI / ML Engineer",
  url: "https://mishal.dev/",
  image: "https://mishal.dev/og-image.png",
  sameAs: [
    "https://github.com/muhammedmishal",
    "https://www.linkedin.com/"
  ],
  knowsAbout: [
    "Artificial Intelligence",
    "Machine Learning",
    "Computer Vision",
    "Multimodal Pipelines",
    "FastAPI",
    "PyTorch"
  ]
};

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
        <script dangerouslySetInnerHTML={{ __html: `if(!window.__heroFetch){var small=innerWidth<=900;var src='/hero/hero'+(small?'-sm':'')+'.mp4';window.__heroSrc=src;window.__heroFetch=fetch(src).catch(function(){return null;});}` }} />
      </head>
      <body>
        <noscript>
          <div style={{ padding: "24px", background: "#0B0B0B", color: "#E8DED0", fontFamily: "sans-serif", textAlign: "center" }}>
            <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>Muhammed Mishal — AI / ML Engineer</h1>
            <p style={{ marginTop: "12px", color: "#D3C6B5" }}>Please enable JavaScript for the full interactive portfolio experience, or download my CV below:</p>
            <a href="/cv.pdf" download style={{ display: "inline-block", marginTop: "16px", padding: "10px 22px", background: "#E8DED0", color: "#0B0B0B", textDecoration: "none", borderRadius: "4px", fontWeight: "600" }}>Download CV</a>
          </div>
        </noscript>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootBuddy() {
  const [BuddyComponent, setBuddyComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    let timer: number | undefined;

    const loadBuddy = () => {
      if (timer) return;
      timer = window.setTimeout(() => {
        import("@/components/Buddy").then((mod) => {
          setBuddyComponent(() => mod.Buddy);
        });
      }, 2000);
    };

    const isLoaderDone = () => {
      if (typeof window !== "undefined" && (window as any).__siteBooted) return true;
      const main = document.querySelector("main");
      return main ? !main.hasAttribute("inert") : false;
    };

    if (isLoaderDone()) {
      loadBuddy();
    } else {
      const interval = window.setInterval(() => {
        if (isLoaderDone()) {
          clearInterval(interval);
          loadBuddy();
        }
      }, 150);
      const onDone = () => {
        clearInterval(interval);
        window.removeEventListener("site-loader-done", onDone);
        loadBuddy();
      };
      window.addEventListener("site-loader-done", onDone);
      return () => {
        clearInterval(interval);
        window.removeEventListener("site-loader-done", onDone);
        clearTimeout(timer);
      };
    }

    return () => clearTimeout(timer);
  }, []);

  if (!BuddyComponent) return null;
  return <BuddyComponent />;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <RootBuddy />
      <DevPerfOverlay />
    </QueryClientProvider>
  );
}
