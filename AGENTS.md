> [!IMPORTANT]
> Avoid rewriting published git history (force pushing, or rebasing/amending/squashing
> commits that are already pushed). Keep commits clean and the branch in a working state.

- All site copy, links and project data live in src/content.ts; components never hard-code copy (single place to edit).
- Desktop uses a paged state machine in src/components/site/Site.tsx (GSAP Observer); small screens use natural scroll (Lenis + ScrollTrigger) — keep both paths when adding pages.
- tsconfig relaxes noUncheckedIndexedAccess / exactOptionalPropertyTypes / noPropertyAccessFromIndexSignature: canvas/array-heavy animation code reads cleaner without per-index guards.
- All page moves go through Site.tsx go(): one shared lock, latest request queued, settlePage() as safety net — prevents stacked transitions and hidden content.
- ElasticLine uses the shared motion ticker and time-normalized springs, gated by page visibility, so proximity pulls remain smooth without competing animation loops.
- DDSS product captures use a content-driven ScreenshotGallery near the start of the native-scroll case study; recorded screenshots are never presented as working model inference, so product evidence remains separate from live retrieval.
- Preload and decode DDSS screenshots when Works mounts; keep the previous gallery image visible until the requested image is ready to prevent blank switches.
- Public retrieval uses content.ts query/reference records and supplied precomputed matches via a pure helper shared by Works and Deep Dive; optional scores/metadata remain absent when not supplied, and placeholder queries cannot return results, preventing invented evidence without a backend.

- Portfolio images use bundled file imports rather than hosted pointer URLs so exported projects render without external asset infrastructure.
- Opening shot has no overlay: Intro tweens the shared stage uniforms (lib/stage.ts) and boot() reports weighted real progress (lib/intro.ts), so loader and hero are one continuous camera shot.
- Overview hero is one shared SceneStage mounted once in Site.tsx behind all pages: WebGL draws only the opening shot (light/zoom from lib/stage.ts), then hands off to the native looping <video> with transform-only parallax and an opacity dim layer — hardware-decoded playback stays smooth, and nothing re-uploads video frames per tick.
- Page wipes, cursor and parallax animate transform/opacity only (no clip-path on full-screen layers, no mix-blend-mode cursor): those forced full-page repaints and caused lag.
- Performance controls live behind ?perf=1 and share runtime layer flags; normal visitors retain always-on motion.
- The scene uses new-video-frame uploads only during the opening shot, capped internal resolution and native playback afterward; hidden/covered scenes pause to avoid wasted work.
- About uses precomposited bundled poses already decoded by boot(); its page-scoped shared ticker animates only image opacity/transform and a short opacity dissolve, avoiding live blending or GPU texture uploads. About-specific word/fact entrance markers keep other pages unchanged.
- About portrait dimensions are bounded by both section width and height so the cutout stays below navigation on short and wide screens.
- Shared motion subscribers run on the GSAP ticker; decorative page work pauses under data-page-transition and resumes afterward, while cursor and navigation stay live.
- Hero playback reuses boot's single downloaded blob and prefers hardware-friendly H.264; the opening WebGL context is released at the native-video handoff to avoid retained texture memory.
- Page components are memoized individually so changing Journey activity or Works subpage cannot rerender unrelated visual pages during a wipe.
- Expertise derives evidence and strongest links from content.ts PROJECTS through a pure helper; one page-scoped shared-ticker canvas renders the map and React updates only interaction state.
- The root head starts one hero fetch reused by boot; boot completion requires a decoded uploaded frame or a six-second native-poster fallback, preventing premature or endless reveals.
- Paged main is fixed to the viewport so inline decorative elements cannot offset opaque pages and expose the underlying scene.
