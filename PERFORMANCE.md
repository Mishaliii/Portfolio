# Performance pass

## Implemented
- Diagnostics appear only at `/?perf=1`; layer switches are runtime-only and do not persist.
- Opening WebGL uses new-video-frame callbacks, numeric dirty tracking, DPR ≤1 and a 1600px internal width cap. Native video still takes over after the opening shot.
- VP9-capable windows below 1500px load `hero-sm.webm`.
- Hidden/covered scenes pause. Returning to Overview activates playback at the start of the wipe.
- Incoming pages stay mounted, hidden with visibility rather than display, and are split/laid out before the timeline starts.
- Headline brush geometry, particle lifetime and sweep timing remain; canvas DPR is 1, particles use reusable pools, and the draw subscription stops when idle. Floating specks are cream, about one in six green; the red scan line is removed.
- Portrait multiply is baked into transparent images. Redundant preserve-3d grouping and fully transparent inactive poses no longer composite continuously.

## Measurements and limitations
No production output was available in this sandbox, and manual project builds are disabled. These are **development-preview, software-rendered Chromium measurements**, not production or real-laptop evidence.

1918×926, approximately 4-second windows (transitions plus settling):

| Case | Initial FPS / longest frame | Representative after FPS / longest frame |
|---|---|---|
| Hero | 57.7 / 50ms | 59.8 / 33.3ms |
| Hero → About | 32.0 / 116.6ms | 37.6 / 100ms |
| Return → hero | Initial return sampler was invalid; do not compare | 57.7 / 33.4ms |

Repeated measurements fluctuated substantially; a later hero run reached only 35.9 FPS / 133.4ms. These numbers cannot establish a consistent real-device improvement. Hero-to-About remains a performance concern.

The hero layer switches did not produce a repeatable winner: baseline generally hovered around 60 FPS and differences were noise. Scene shader, grain, nav blur, Lenis and section wipe do not contribute to a settled desktop hero (native video, no hero grain/blur, no desktop Lenis, idle wipe). Video switch pauses native playback after handoff; shader switch disables only the opening shader. Disabling a wipe necessarily removes that animation and is not a like-for-like benchmark.

The clearest isolation signal was the About portrait: hiding it changed approximately 22.6–29 FPS to 59.7–60.4 FPS. Flattening its extra 3D grouping improved the isolated check to approximately 52–57 FPS. This does not prove the whole transition is fixed.

## Verified
- All six navigation destinations and return to Overview, no runtime errors.
- `hero-sm.webm` selected at 1280×720.
- Diagnostics absent without `?perf=1`; all eight checkboxes respond.
- No `/scene/` or `/scene-sm/` requests; no old head-turn frame loading or ImageBitmap retention exists in the active boot code. Legacy files remain on disk but are not decoded.
- 15 regression tests passed; harness compilation reports build OK.

## Still required
- Comparable production before/after measurements on hardware-accelerated Chromium at 1918×926, including a valid return baseline.
- Real-device confirmation of pointer and transition smoothness, and further profiling if About still drops frames.