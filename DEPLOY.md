# Deployment Guide: Cloudflare Pages (Free Tier)

This portfolio is built with **TanStack Start** and bundled via **Nitro**. It deploys to **Cloudflare Pages** with automatic SSL, global CDN edge distribution, range-request video streaming, and zero server maintenance costs.

---

## Verified Build Configuration

When `NITRO_PRESET=cloudflare-pages` is set, Nitro generates:
- **Build Output Directory**: `dist/`
- Static assets, images, video assets, and `_headers` are bundled directly into `dist/`.
- Edge worker functions and `_routes.json` are bundled to `dist/_worker.js`.

---

## Deployment Option A: Git-Integrated (Recommended)

Continuous delivery automatically builds and deploys on every push to your GitHub repository.

1. Push your code to GitHub: `https://github.com/Mishaliii/Portfolio`
2. Open the [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Compute (Workers & Pages)** > **Create** > **Pages** > **Connect to Git**.
3. Select the repository: `Mishaliii/Portfolio`.
4. Configure the build settings:
   - **Framework preset**: `None`
   - **Build command**: `bun run build`
   - **Build output directory**: `dist`
   - **Environment variables**:
     - `NITRO_PRESET`: `cloudflare-pages`
     - `NODE_VERSION`: `20`
     - `VITE_SITE_URL`: `https://portfolio-30x.pages.dev` (or your chosen Pages URL)
5. Click **Save and Deploy**. Cloudflare will build and publish your site at `https://portfolio-30x.pages.dev` (or your assigned subdomain).

---

## Deployment Option B: Direct CLI Deployment (Wrangler)

If you prefer deploying directly from your terminal:

### 1. Build the Project

```bash
# Windows PowerShell:
$env:NITRO_PRESET="cloudflare-pages"; bun run build

# Linux / macOS / Bash:
NITRO_PRESET=cloudflare-pages bun run build
```

Verify that the `dist/` directory was generated and all assets are under 24 MiB (Cloudflare Pages file size limit is 25 MiB).

### 2. Deploy with Wrangler

```bash
# Log in to Cloudflare (one-time interactive login):
npx wrangler login

# Deploy the dist directory:
npx wrangler pages deploy dist --project-name=mishal-portfolio
```

---

## Optional: Custom Domain Setup (Later Step)

If you acquire a custom domain later:

1. In the Cloudflare Dashboard, navigate to your Pages project (**Workers & Pages** > **mishal-portfolio**).
2. Go to the **Custom domains** tab and click **Set up a custom domain**.
3. Enter your domain name (e.g., `yourdomain.com`).
4. If your domain's DNS is managed on Cloudflare, DNS records and SSL are configured automatically. If managed by an external registrar, create a `CNAME` record pointing to `<your-project>.pages.dev`.
5. Update `VITE_SITE_URL` in your Cloudflare Pages project environment variables to match your custom domain.

---

## Edge Asset Optimization & Range Requests

Cloudflare Pages automatically processes `public/_headers` (copied to `dist/_headers` during build):
- `/assets/*`: `Cache-Control: public, max-age=31536000, immutable` (hashed client bundles permanently cached).
- `/hero/*.mp4` and `/media/*`: `Accept-Ranges: bytes` (enables seamless video seeking, scrubbing, and streaming).
- `cv.pdf`: `Cache-Control: public, max-age=3600, must-revalidate` (ensures visitors always download the freshest CV).

---

## Post-Deploy Verification Checklist

Verify edge security headers and health on your deployed URL:

```bash
# 1. Check security headers & HTTP 200 response
curl -I https://portfolio-30x.pages.dev/

# 2. Verify sensitive files return 404 (not accessible)
curl -I -s -o /dev/null -w "%{http_code}\n" https://portfolio-30x.pages.dev/.env
curl -I -s -o /dev/null -w "%{http_code}\n" https://portfolio-30x.pages.dev/.git/config
curl -I -s -o /dev/null -w "%{http_code}\n" https://portfolio-30x.pages.dev/.env.production
```
