// CareerLens Vite & TanStack Start build configuration
// Bundles TanStack Start, Nitro SSR, Vite React, Tailwind CSS v4, and tsConfig paths.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
});
