const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateOgImage() {
  const width = 1200;
  const height = 630;
  const posterPath = path.resolve('public/hero/poster.webp');
  const outputPath = path.resolve('public/og-image.png');

  // SVG overlay for branding and typography
  const svgOverlay = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0B0B0B" stop-opacity="0.25"/>
        <stop offset="60%" stop-color="#0B0B0B" stop-opacity="0.65"/>
        <stop offset="100%" stop-color="#0B0B0B" stop-opacity="0.92"/>
      </linearGradient>
      <linearGradient id="leftGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#0B0B0B" stop-opacity="0.85"/>
        <stop offset="65%" stop-color="#0B0B0B" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#0B0B0B" stop-opacity="0.1"/>
      </linearGradient>
    </defs>

    <!-- Dark gradient overlays for high text contrast -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
    <rect width="${width}" height="${height}" fill="url(#leftGrad)"/>

    <!-- Subtle framing border -->
    <rect x="24" y="24" width="${width - 48}" height="${height - 48}" fill="none" stroke="#E8DED0" stroke-opacity="0.18" stroke-width="1.5" rx="8"/>

    <!-- Top Badge -->
    <g transform="translate(70, 75)">
      <rect width="168" height="34" rx="17" fill="#1F5A3A" fill-opacity="0.6" stroke="#2EB872" stroke-width="1.2"/>
      <circle cx="20" cy="17" r="4.5" fill="#2EB872"/>
      <text x="34" y="22" font-family="'JetBrains Mono', monospace, sans-serif" font-size="12" font-weight="600" fill="#E8DED0" letter-spacing="1.2">OPEN TO WORK</text>
    </g>

    <!-- Main Name / Title -->
    <text x="70" y="320" font-family="'Anton', 'Impact', sans-serif" font-size="94" font-weight="900" fill="#E8DED0" letter-spacing="3">MUHAMMED MISHAL</text>

    <!-- Subtitle / Role -->
    <text x="74" y="380" font-family="'JetBrains Mono', monospace, sans-serif" font-size="24" font-weight="600" fill="#E5C158" letter-spacing="2">AI / ML ENGINEER</text>

    <!-- Domain & Focus tags -->
    <text x="74" y="440" font-family="'Manrope', sans-serif" font-size="20" font-weight="500" fill="#D3C6B5" letter-spacing="0.5">Computer Vision &amp; Diagnostics • Multimodal Pipelines • Public Intelligence</text>

    <!-- Footer URL -->
    <g transform="translate(74, 555)">
      <text font-family="'JetBrains Mono', monospace, sans-serif" font-size="16" font-weight="500" fill="#E8DED0" fill-opacity="0.75" letter-spacing="1">https://mishal.dev</text>
    </g>
  </svg>
  `;

  await sharp(posterPath)
    .resize(width, height, { fit: 'cover', position: 'center' })
    .composite([
      {
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0,
      }
    ])
    .png({ quality: 92 })
    .toFile(outputPath);

  console.log(`Generated og-image at ${outputPath} (${fs.statSync(outputPath).size} bytes)`);
}

generateOgImage().catch(e => { console.error(e); process.exit(1); });
