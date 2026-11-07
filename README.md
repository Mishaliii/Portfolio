# Muhammed Mishal — AI / ML Engineer Portfolio

Interactive portfolio showcasing vision, retrieval, and backend systems for production machine learning.

## Tech Stack & Architecture

- **Framework**: [TanStack Start](https://tanstack.com/start) with React 19, TypeScript, and Vite.
- **Server & Deployment**: [Nitro](https://nitro.unjs.io/) multi-preset engine (Node.js server, Cloudflare Pages/Workers).
- **Motion & Physics**: [GSAP](https://gsap.com/) (Observer, ScrollTrigger, SplitText) with shared motion ticker and springs.
- **Hero Scene**: Seamless dual-video hardware-decoded ping-pong playback with zero shaders and transform-only cursor parallax.
- **Styling**: Tailwind CSS + custom design tokens.
- **Interactive Assistant**: Sprout — client-side intelligent portfolio assistant running purely in-memory from verified structured content.

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) (recommended) or Node.js >= 20

### Installation
```bash
bun install
```

### Development
Start the local development server:
```bash
bun run dev
```

### Production Build & Preview
Build the production bundle with Nitro:
```bash
# Node server build
NITRO_PRESET=node-server bun run build

# Run local production server
PORT=3000 node .output/server/index.mjs
```

### Tests & Quality Audits
```bash
# Typecheck
bun x tsc --noEmit

# Unit & integration tests
bun run test

# Full release smoke test suite (desktop)
node scripts/release-smoke.cjs http://127.0.0.1:3000

# Full release smoke test suite (mobile 390x844 touch emulation)
node scripts/release-smoke.cjs http://127.0.0.1:3000 --mobile
```

## Deployment

Detailed zero-cost Cloudflare Pages & Cloudflare Workers deployment steps can be found in [DEPLOY.md](DEPLOY.md).
