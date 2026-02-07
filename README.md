# knottymanni

Online catalog for a family-owned e-commerce venture, built with Eleventy.

## Local development

```bash
npm install
npm run start
```

Build static output:

```bash
npm run build
```

## Image placeholders note

Current `images/**` sample `.jpg` files are text placeholders to keep PR tooling compatible in binary-restricted environments. Replace them with real JPEG files before production use.

## Image pipeline

- Originals live in `images/<category>/<slug>/<file>.jpg`.
- Thumbnails are generated into `src/assets/generated/thumbs/<category>/<slug>/<file>.jpg` (same filenames, deterministic paths).
- Category grids and the featured grid use thumbnails; item detail pages use full-size originals.

To add or update images:

- Add the image files under `images/<category>/<slug>/`.
- Update the item markdown front matter `images:` list to match filenames.
- Run `npm run images` (or `npm run build`) to regenerate thumbnails.

Supported thumbnail inputs: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`. Non-image placeholder files are skipped and logged; replace them with real binary images to generate thumbnails.

## Deploy to GitHub Pages

1. Push to `main` (the workflow builds and deploys on every push).
2. In GitHub: Settings → Pages → set **Source** to **GitHub Actions**.
3. Update `SITE_URL` and `ELEVENTY_PATH_PREFIX` if your repo name or owner changes.

The workflow sets:

- `SITE_URL` to `https://<owner>.github.io/<repo-name>`
- `ELEVENTY_PATH_PREFIX` to `/<repo-name>/`

These control canonical/OG URLs and asset links for GitHub Pages.

## Switching later (Netlify / Cloudflare Pages)

- Netlify: set `ELEVENTY_PATH_PREFIX=/` and `SITE_URL=https://your-domain` in build env.
- Cloudflare Pages: same env vars; build command stays `npm run build`, output is `dist`.

## Branding

- Fonts: drop `BrandFont-Regular.woff2` + `BrandFont-Bold.woff2` (and optional `.woff`) into `src/assets/fonts/`.
- Logo: place `logo.svg` (preferred) or `logo.png` in `src/assets/images/`.
- Colors: update CSS variables in `src/assets/css/main.css` under `:root` (`--bg`, `--surface`, `--text`, `--muted`, `--brand`, `--accent`, `--border`, `--radius`, `--shadow`, `--focus`).
