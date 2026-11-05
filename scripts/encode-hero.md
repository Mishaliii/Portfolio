# Hero Video Encoding & Pipeline Guide

## 1. Source & Asset Specifications
- **Clip**: Google Flow (Veo 3.1 Quality) export
- **Original Resolution**: 1920x1080 @ 24 fps
- **Duration**: 7.041667 seconds (169 frames @ 24 fps)
- **GOP**: Closed GOP 24 (`-g 24 -keyint_min 24 -sc_threshold 0`)
- **Seamless Loop**: Built-in 0.79s crossfade baked into the source video frames (watermark cropped out)
- **Small Video (`hero-sm.mp4`)**: 1280x720, served for viewport widths `<= 1366px`
- **Poster (`poster.webp`)**: Frame 0 of `hero.mp4`

---

## 2. Recommended FFmpeg Clean-Up & Encode Chain

When preparing or reprocessing source hero footage from raw captures:

### A. Denoise and Pre-Filter
Light temporal denoise to remove compression noise without blurring high-frequency edges:
```bash
ffmpeg -i source_raw.mp4 -vf "hqdn3d=1.5:1.5:6:6" -c:v libx264 -crf 16 -preset slow -an denoise_stage.mp4
```

### B. Upscale / Downscale Chain
For super-resolution, upscale 2x with Real-ESRGAN (`realesrgan-x4plus` or `realesr-animevideov3`), followed by lanczos downscale and mild unsharp/CAS filter:
```bash
ffmpeg -i upscaled_4k.mp4 -vf "scale=1920:1080:flags=lanczos,unsharp=3:3:0.5:3:3:0.0" -c:v libx264 -crf 17 -preset veryslow -g 24 -keyint_min 24 -sc_threshold 0 -pix_fmt yuv420p -an hero.mp4
```

### C. Small Video Encode (720p for <= 1366px screens)
```bash
ffmpeg -i hero.mp4 -vf "scale=1280:720:flags=lanczos" -c:v libx264 -crf 19 -preset veryslow -g 24 -keyint_min 24 -sc_threshold 0 -pix_fmt yuv420p -an hero-sm.mp4
```

### D. Poster Generation (Frame 0)
```bash
ffmpeg -ss 00:00:00.000 -i hero.mp4 -vframes 1 -c:v libwebp -quality 90 -compression_level 6 poster.webp
```

---

## 3. Playback & Sharpness Rules
1. **Container Headroom without Resampling**:
   - `.scene-move` is rendered 3% oversized (`inset: -1.5%; width: 103%; height: 103%`) with `transform: translate3d(x, y, 0)`.
   - `scale(1.06)` was removed to prevent continuous GPU bilinear resampling and blurriness.
2. **Anti-Banding & Texture**:
   - Static 256x256 monochrome film-grain PNG (`/hero/grain.png`) overlaid with `mix-blend-mode: soft-light` at 5% opacity.
   - Matched grain overlay on `.hero-shade` prevents 8-bit dark gradient quantization banding.
3. **Seamless Handover**:
   - The two-video ping-pong architecture primes the next video at `t >= len - 0.08s` and performs a frame-exact instant opacity swap at `t >= len - 0.04s`, eliminating duplicate crossfade dips.
