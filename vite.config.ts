import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: {
    preset: process.env.NITRO_PRESET || "node-server",
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      watch: {
        ignored: [
          "**/.git/**",
          "**/.output/**",
          "**/.tanstack/**",
          "**/node_modules/**",
          "**/scratch/**",
        ],
      },
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-router",
        "@tanstack/react-query",
        "@tanstack/query-core",
        "gsap",
        "gsap/SplitText",
        "gsap/Observer",
        "gsap/ScrollTrigger",
        "lenis",
        "lucide-react",
        "clsx",
        "tailwind-merge",
      ],
      exclude: ["@tanstack/react-start", "@tanstack/start-storage-context"],
      entries: ["src/routes/**", "src/components/**"],
    },
  },
});
