
# CareerLens AI — Phased Frontend Plan

Full build staged across 3 phases. After each phase you review the UI, then I proceed. All data is mocked from typed fixtures; a thin `apiClient` wraps `fetch` and reads `VITE_API_URL` so real endpoints drop in later without page changes.

Stack adaptations (from your spec):
- **TanStack Router** (file-based, `src/routes/`) instead of React Router v6. All URLs from your spec are preserved.
- **TypeScript `.tsx`** instead of `.jsx` (project is strict TS).
- **`localStorage` token + protected `_authenticated` layout** replaces the React Router wrapper.
- **Mock data** everywhere — no Cloud, no real auth. `apiClient` posts to `/auth/login` etc. but a mock adapter short-circuits to fixtures so the UI is fully interactive.

---

## Design commitments (locked)

Same palette as your spec, tightened to avoid generic-AI-dashboard feel:

- **Colors** (exact): bg `#0F1117`, surface `#1A1D27`, border `#2A2D3A`, text `#F0F0F0` / `#8B8FA8` / `#4A4D5E`, indigo `#6366F1`, green `#1D9E75`, amber `#EF9F27`, red `#E24B4A`. Wired as tokens in `src/styles.css` under `@theme inline` so Tailwind classes like `bg-surface`, `text-muted`, `border-line` work everywhere (no arbitrary `bg-[#...]` scattered in JSX).
- **Type**: Space Grotesk for headings/metric numbers, Inter for body/UI. Loaded via `<link>` in `__root.tsx` head (Tailwind v4 rule). Tabular numerals on all metrics.
- **Signature details** (subtle, not decorative):
  - Logo wordmark uses a 1px indigo→violet gradient on "Lens".
  - Match-score badges use a 1px inset ring + soft color-mix background instead of flat pills.
  - Metric cards get a hairline top gradient (indigo at 8% opacity) — no drop shadows.
  - Active sidebar item: 2px indigo left rail + `bg-indigo-500/10`, not a full pill.
- Rounded-xl cards, rounded-lg buttons, no `rounded-full` outside avatars/badges. No heavy shadows.

---

## Phase 1 — Foundations + Dashboard + Find Jobs

### 1. Design system + tokens
- `src/styles.css`: add color tokens (`--background`, `--surface`, `--line`, `--text`, `--text-muted`, `--text-dim`, `--accent`, `--success`, `--warning`, `--danger`) in `:root`, map them under `@theme inline` (`--color-surface: var(--surface)` etc.), register `--font-sans: "Inter"` and `--font-display: "Space Grotesk"`.
- `src/routes/__root.tsx`: add Google Fonts `<link>` tags, set real head metadata ("CareerLens AI — Your career command center"), keep the existing error/notfound boundaries.

### 2. API client + utilities
- `src/api/client.ts` — axios-like wrapper on `fetch` with `baseURL = import.meta.env.VITE_API_URL`, request interceptor injecting `Authorization: Bearer <token>`, response interceptor redirecting to `/login` on 401. Exposes `get/post/put/del`.
- `src/api/mock.ts` — request matcher returning fixtures for every endpoint used in Phase 1 (`/auth/login`, `/auth/register`, `/dashboard/summary`, `/jobs`, `/tracker/save`). Toggle via `VITE_USE_MOCKS` (default on).
- `src/utils/auth.ts` — `getToken/setToken/removeToken/isLoggedIn`.
- `src/utils/format.ts` — `formatTimeAgo`, `formatScore`, `getScoreColor`, `getGreeting`.
- `src/hooks/useApi.ts` — `{data, loading, error, refetch}` hook.
- `src/data/fixtures.ts` — typed mock jobs, dashboard summary, user, skill gaps, activity.

### 3. Shared UI components (`src/components/`)
`Sidebar`, `TopBar`, `MetricCard`, `JobCard`, `MatchBadge`, `AlertBar`, `SkillBadge`, `Toast` (custom context-based stack, 3s auto-dismiss), `Skeleton` (pulse blocks), `EmptyState`, `ErrorState`. Icons via `lucide-react` (already available). All match your prop specs.

### 4. Routing + protected layout
- `src/routes/index.tsx` — redirects to `/dashboard` if `isLoggedIn()`, else `/login`. Replaces the current placeholder.
- `src/routes/login.tsx`, `src/routes/register.tsx` — standalone (no sidebar).
- `src/routes/_authenticated/route.tsx` — pathless layout: checks token, redirects to `/login`, renders `<Sidebar />` + `<Outlet />` in a `flex` shell (`ml-[200px]`). This is the wrapper for every protected page.
- `src/routes/_authenticated/dashboard.tsx` — Dashboard page.
- `src/routes/_authenticated/jobs.tsx` — Find Jobs page.
- `src/routes/ats.tsx` — placeholder for Phase 2 (public route, needed because Sidebar links to it and unauthenticated users can hit it). Renders a "Coming in Phase 2" stub for now — I will build the real page in Phase 2.
- All other sidebar links (`/resume`, `/roadmap`, `/interview`, `/copilot`, `/tracker`, `/profile`) are Phase 2/3; sidebar entries render but the routes don't exist yet, so I'll add minimal "coming soon" stubs under `_authenticated/` so nav doesn't 404. They'll be replaced with real pages in later phases.

### 5. Auth pages
- `Login`: centered card, gradient wordmark, email/password with inline validation, indigo full-width Sign In, "Sign up" link. Submits to `/auth/login` (mock returns `{token, user}`), stores token, navigates to `/dashboard`.
- `Register`: full name / email / password / confirm password with match validation. Auto-login on success.

### 6. Dashboard page
Exactly per your spec:
- Time-aware `TopBar` greeting + "N new jobs" subtitle + Upload Resume button + avatar with initials.
- Conditional single `AlertBar` (priority: interview > ATS<70 > stale resume; else hidden).
- Row 1: 4 `MetricCard`s (Resume Readiness w/ progress, Applications, Avg Match, Interview Score).
- Row 2: 60/40 grid — Top matches today (3 compact JobCards, no action buttons) + Top skill gaps (3 skills w/ counts + indigo footer CTA).
- Row 3: 50/50 grid — Recent activity (4 items, colored dots) + Application snapshot (2x2 numeric grid + response rate line).
- Loads via `useApi('/dashboard/summary')`, shows Skeleton grid while loading, ErrorState with retry on failure.
- Desktop-first, fits without scrolling at ≥1280px; wraps gracefully below.

### 7. Find Jobs page
- Horizontal filter bar: search, location dropdown, experience, job type, posted, match-min slider (0–100), results-per-page (20/30/50), Clear.
- Results header: count + sort dropdown.
- Vertical `JobCard` list with Save (POST `/tracker/save` → toast) and Apply (`navigate('/apply/:jobId')` — target page arrives in Phase 3; for now shows the coming-soon stub).
- Load more pagination.
- EmptyState when filters yield nothing, Skeleton while loading.
- All filter state kept in URL search params via TanStack Router's `validateSearch` so it survives refresh and is shareable.

### 8. Verification
- Typecheck via build.
- Playwright smoke: load `/`, expect redirect to `/login`; submit mock login; land on `/dashboard`; assert 4 metric cards, skill gap CTA text, sidebar active state; navigate to `/jobs`; apply a filter; screenshot both pages at 1280×1800.

---

## Phase 2 (preview, built after you approve Phase 1)

Resume Center (Upload + Build multi-step, ATS score circle), ATS Checker (standalone, works without login, with signup CTA banner), Career Roadmap (weekly timeline w/ completion state). Adds `/cv/upload`, `/builder/*`, `/ats/check`, `/roadmap/*` mock endpoints.

## Phase 3 (preview)

Interview Coach (Setup / Active / Summary / Progress with Recharts line), Co-pilot (chat with sources panel + suggested questions), Job Tracker (table with expandable rows + status pipeline), Easy Apply (`/apply/:jobId` 3-column kit), Profile (6-tab editor with auto-save indicator). Adds `/interview/*`, `/copilot/*`, `/tracker/*`, `/apply/kit/:jobId`, `/profile` mocks.

---

## Technical notes

- File naming follows TanStack rules: `_authenticated/dashboard.tsx` → URL `/dashboard`, `createFileRoute("/_authenticated/dashboard")`.
- No `src/pages/`, no React Router DOM, no shadcn/MUI/Chakra — pure Tailwind + Lucide + Recharts (Recharts added in Phase 3).
- Toast system is a `ToastProvider` mounted in `RootComponent` beside `QueryClientProvider`.
- `useApi` uses TanStack Query under the hood (already installed) but exposes your requested `{data, loading, error, refetch}` shape.
- Every card/border/text uses semantic Tailwind classes (`bg-surface`, `border-line`, `text-muted`) — no hardcoded hex in JSX.

Approve to start Phase 1.
