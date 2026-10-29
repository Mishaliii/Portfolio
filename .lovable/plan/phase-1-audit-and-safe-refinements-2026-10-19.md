# Phase 1 — Audit and safe refinements

## Audit (from the current code)

**Section transitions (Site.tsx)**
- One GSAP timeline per move (~1.2s): wipe in, big label, swap page, wipe out, entrance reveal. Input is locked while it plays; scroll debounce uses a fresh-gesture + 1s cooldown rule.
- Risk: a nav click, a number key and a scroll inside the same 1.2s can stack. Only the scroll path checks `busy`; keyboard and pill clicks need to share the same lock and queue the latest target instead of dropping it.
- Risk: `enterPage` starts headings, lines and visuals at `opacity: 0`. If a timeline is killed mid-way (rapid moves, tab hidden), content can stay hidden. Add a safety "settle" step that clears these styles on the active page when a timeline is interrupted.

**Animation systems**
- Three systems overlap: GSAP timelines, CSS keyframes (grain, ticker, live dot, breathe) and the shared canvas ticker. No conflict found in the code, but `ElasticLine.tsx` is unused and can be deleted.
- `reduced()` is hard-wired to `false` (your earlier choice: motion always on). The brief asks for prefers-reduced-motion support, which conflicts with that choice. See Open questions.

**Layout**
- Desktop pages are fixed to 100dvh with clamp() sizes; the four target sizes were checked earlier. Your current window (1068x686) sits just above the paged-mode cutoff (1024x600) and hasn't been tested. Expect tight vertical space on Works and Expertise.
- Works: in paged mode the cards are stacked absolutely, so off-screen cards are clipped by design. That isn't a bug.

**Accessibility**
- Pills, palette, timeline entries and buttons can all be reached with the keyboard. The custom cursor hides the native one, but no visible focus ring style is defined globally. Add a `:focus-visible` gold outline.
- Hot words have a tap fallback. The Journey timeline uses hover but also works on focus and auto-advances, so touch isn't blocked.
- Hidden stacked Works cards use `aria-hidden` but can still be tabbed into. Add `inert` to non-active cards.

**Performance**
- The portraits are full-size PNGs from the CDN. Add `loading`/`decoding` hints and explicit sizes. Recompressing them needs your approval because it changes the image files.

## Phase 1 changes (smallest safe set)

1. **Transitions:** one shared lock for every way of moving (scroll, keys, pills, palette, hash). Remember the last target requested during a move and go there next. Add a safety settle so content can't stay hidden.
2. **Focus states:** a global `:focus-visible` outline in gold-text, with an ink/cream variant on dark pages.
3. **Works:** make the Dermatology project the flagship, with a "Flagship" label and a pipeline line under the title: Input Image → DINOv2 Embedding → Similarity Retrieval → Retrieved Cases. Add a `status` field per project (Completed / In progress / Planned) shown as a mono label. Add `inert` to hidden cards.
4. **Hero copy:** tighten the supporting line to machine learning, computer vision and intelligent systems. Change the secondary button to "View projects" (goes to Works) and keep Download CV as the main button. "Say hello" stays in the top bar. All copy stays in content.ts.
5. **Cleanup:** delete the unused ElasticLine.

## Files touched
- src/components/site/Site.tsx: shared lock, queued target, settle step
- src/lib/motion.ts: settle helper
- src/styles.css: focus-visible styles
- src/components/site/PageWorks.tsx: flagship label, pipeline line, status label, inert
- src/components/site/PageHero.tsx: button change
- src/content.ts: hero copy, project status, flagship pipeline, new labels
- remove src/components/site/ElasticLine.tsx

## Verification
- Check the build. Use Playwright at 1068x686, 1280x720 and 1920x1080 for rapid scrolling, reverse scrolling, keyboard moves and the Works cards. Report anything left for manual testing (touch devices, real trackpad inertia).

## Open questions (needed before or during Phase 1)
- **SmartCampus Transit Monitoring and ETA Prediction System** isn't in the site right now, because CareerLens is the second project. Should it replace CareerLens or be added next to it? Please send its stack, problem, approach, result and limitations, and what's finished versus planned. Until then it won't be added.
- **Reduced motion:** you asked earlier for motion to always be on. Should visitors whose system asks for less motion now get simple fades? If you don't answer, motion stays always on.
