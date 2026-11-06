# Deployment Guide: Cloudflare Pages & Cloudflare Workers (Free Tier)

This portfolio is built with **TanStack Start** and bundled via **Nitro**. It can be deployed 100% free of charge to Cloudflare Pages or Cloudflare Workers with custom domains, automatic SSL, worldwide CDN edge caching, and zero server maintenance.

---

## Option 1: Cloudflare Pages (Recommended - Free Tier)

Cloudflare Pages provides free hosting with unlimited bandwidth, custom domains, and automatic branch previews.

### Step 1: Install Wrangler CLI (if not already installed)
```bash
bun add -d wrangler
# or run on demand with npx:
npx wrangler --version
```

### Step 2: Build for Cloudflare Pages
```bash
# Set NITRO_PRESET to cloudflare-pages and run the build:
NITRO_PRESET=cloudflare-pages bun run build
```
This generates:
- `.output/public` (all static assets, images, videos, `_headers`, and client bundles)
- `.output/server/_routes.json` (routing rules for Pages functions)

### Step 3: Deploy to Cloudflare Pages
```bash
# First login to Cloudflare (one-time interactive login):
npx wrangler login

# Deploy the output directory:
npx wrangler pages deploy .output/public --project-name=mishal-portfolio
```

### Alternative Step 3: Git-Integrated Deployment (Continuous Delivery)
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Select your repository (`mishal-intelligence-portfolio`).
3. Set the build settings:
   - **Framework preset**: `None`
   - **Build command**: `NITRO_PRESET=cloudflare-pages bun run build`
   - **Build output directory**: `.output/public`
   - **Environment variables**:
     - `NODE_VERSION`: `20`
4. Click **Save and Deploy**. Every `git push` to `main` or `release` will now automatically build and publish.

---

## Option 2: Cloudflare Workers (Free Tier)

If deploying as a standalone edge Worker:

### Step 1: Build for Cloudflare Module
```bash
NITRO_PRESET=cloudflare-module bun run build
```

### Step 2: Deploy with Wrangler
```bash
npx wrangler deploy
```

---

## Custom Domain Setup (`mishal.dev`)

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com/) and go to your Pages project (**Workers & Pages** > **mishal-portfolio**).
2. Click the **Custom domains** tab.
3. Click **Set up a custom domain**.
4. Enter your domain: `mishal.dev` (and optionally `www.mishal.dev`).
5. **If your domain's DNS is already on Cloudflare**:
   - Cloudflare automatically creates the CNAME records pointing to your project.
   - SSL/TLS certificate is provisioned automatically within minutes.
6. **If your domain is hosted on an external registrar (e.g. Namecheap, GoDaddy, Google Domains)**:
   - Add a `CNAME` record at your registrar:
     - **Host / Name**: `@` (or `www`)
     - **Target**: `<your-project>.pages.dev`
     - **TTL**: `Auto` or `300`
7. In Cloudflare **SSL/TLS** settings, ensure encryption mode is set to **Full** or **Full (strict)**.

---

## Asset Caching & Range Requests Verification

The repository includes `public/_headers` which Cloudflare Pages reads automatically on every deployment:
- `/assets/*`: `Cache-Control: public, max-age=31536000, immutable` (hashed chunks are permanently cached on the edge and browser).
- `/hero/*.mp4` and `/media/*`: `Accept-Ranges: bytes` (enables browser video scrubbing and instant streaming).
- `cv.pdf`: `Cache-Control: public, max-age=3600, must-revalidate` (ensures visitors always get updated resumes).
