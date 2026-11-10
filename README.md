# Muhammed Mishal — AI / ML Engineer Portfolio

Interactive, performance-tuned engineering portfolio of **Muhammed Mishal**, AI / ML Engineer specializing in Computer Vision, Vector Retrieval, and production Machine Learning systems.

Live Site: **[https://portfolio-30x.pages.dev](https://portfolio-30x.pages.dev)**

---

## Preview

![Muhammed Mishal Portfolio Hero](public/hero/poster.webp)

---

## Key Features

- **Fluid Page Journey**: Linear 6-stage presentation spanning Hero, About, Journey, Works, Expertise, and Connect, driven by hardware-accelerated transitions and Lenis smooth scrolling.
- **Sprout AI Assistant**: Lightweight interactive character grounded strictly in verified resume data from `src/content.ts`, answering inquiries with zero external API dependencies or hallucinations.
- **Case-Study Drawers**: Deep-dive interactive drawers for featured works (Dermatology Decision Support System, Productivity & Role Prediction, CareerLens AI) with architecture breakdowns, sample session data, and embedded demo previews.
- **GSAP & Canvas Motion**: Handcrafted interactive animations including cursor erase effects, stacked card physics, and particulate dissolve typography.
- **No Autoplay Audio**: Quiet, distraction-free user experience focused purely on engineering substance and visual clarity.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [TanStack Start](https://tanstack.com/start) (React 19, TypeScript) |
| **Bundling & Edge SSR** | [Vite 8](https://vitejs.dev/) & [Nitro](https://nitro.unjs.io/) |
| **Animation & Scroll** | [GSAP](https://gsap.com/) (Observer, ScrollTrigger, SplitText), [Lenis](https://lenis.darkroom.engineering/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **Icons & Typography** | [Lucide React](https://lucide.dev/), Anton, JetBrains Mono, Manrope |
| **Quality & Smoke Testing** | [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/) |
| **Deployment Target** | [Cloudflare Pages](https://pages.cloudflare.com/) (Free Tier Edge Network) |

---

## Project Structure

```
.
├── .github/
│   └── dependabot.yml          # Automated weekly dependency updates
├── public/
│   ├── _headers                # Cloudflare Pages edge caching & range headers
│   ├── cv.pdf                  # Verified resume / curriculum vitae
│   ├── hero/                   # Optimized hero video and poster
│   └── media/                  # Case study demonstration video & poster
├── scripts/
│   ├── release-smoke.cjs       # 65-point desktop & 18-point mobile smoke test suite
│   └── works-perf.cjs          # Card stack performance benchmark script
├── src/
│   ├── components/site/        # Modular page sections, drawers, Sprout assistant
│   ├── lib/                    # Site URL configuration, buddy matcher, error logger
│   ├── routes/                 # TanStack file-based routes
│   ├── content.ts              # Single source of truth for portfolio facts
│   └── server.ts               # SSR entry point
├── DEPLOY.md                   # Cloudflare Pages deployment instructions
├── LICENSE                     # MIT License
└── vite.config.ts              # TanStack Start, Nitro, and Vite build configuration
```

---

## Local Development

### 1. Install Dependencies

```bash
bun install
```

### 2. Start Development Server

```bash
bun run dev
```

### 3. Production Build

```bash
# Standard local Node build:
bun run build

# Cloudflare Pages edge build:
NITRO_PRESET=cloudflare-pages bun run build
```

The Cloudflare Pages build outputs edge assets and workers directly into `dist/`.

---

## Verification & Testing Suites

Before every release, run the complete validation suite:

```bash
# 1. TypeScript compilation check
bun x tsc --noEmit

# 2. Vitest unit and integration suites
bun run test

# 3. Release smoke test suite (Desktop 1918x932, 65 automated checks)
node scripts/release-smoke.cjs http://127.0.0.1:3000

# 4. Release smoke test suite (Mobile 390x844 with touch emulation, 18 checks)
node scripts/release-smoke.cjs http://127.0.0.1:3000 --mobile
```

---

## Deployment

Deployable to **Cloudflare Pages** at zero hosting cost. Detailed instructions are available in [DEPLOY.md](DEPLOY.md).

Quick CLI deploy:
```bash
NITRO_PRESET=cloudflare-pages bun run build
npx wrangler pages deploy dist --project-name=mishal-portfolio
```

---

## Contact & Connect

- **Engineer**: Muhammed Mishal
- **Email**: [muhammedmishalkpm13@gmail.com](mailto:muhammedmishalkpm13@gmail.com)
- **LinkedIn**: [linkedin.com/in/muhammedmishal13](https://www.linkedin.com/in/muhammedmishal13/)
- **GitHub**: [github.com/Mishaliii](https://github.com/Mishaliii)

---

## License

This project is licensed under the [MIT License](LICENSE).
