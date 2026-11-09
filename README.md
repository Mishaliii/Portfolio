# Muhammed Mishal — AI / ML Engineer Portfolio

Interactive portfolio showcasing vision, retrieval, and backend systems for production machine learning.

## Quick Start

### 1. Install Dependencies
```bash
bun install
```

### 2. Development Server
```bash
bun run dev
```

### 3. Production Build
```bash
# Default local Node.js server
bun run build

# Cloudflare Pages deployment build
NITRO_PRESET=cloudflare-pages bun run build
```

### 4. Run Production Server
```bash
PORT=3000 node .output/server/index.mjs
```

---

## Verification & Scripts

```bash
# Typecheck
bun x tsc --noEmit

# Unit & integration tests
bun run test

# Release smoke test suite (desktop 1918x932)
node scripts/release-smoke.cjs http://127.0.0.1:3000

# Release smoke test suite (mobile 390x844)
node scripts/release-smoke.cjs http://127.0.0.1:3000 --mobile
```

---

## Deployment

Deployable to **Cloudflare Pages** at zero cost with automated edge caching, range request video streaming, and custom domain SSL:
```bash
NITRO_PRESET=cloudflare-pages bun run build
npx wrangler pages deploy dist --project-name=mishal-portfolio
```
See [DEPLOY.md](DEPLOY.md) for full Cloudflare Pages & Workers deployment instructions.
