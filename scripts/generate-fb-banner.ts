/**
 * Generates a high-resolution Facebook page cover banner (1640x856).
 *
 * Uses the existing coaching room photo as the background, applies a soft
 * vertical scrim for text legibility, and centers an "Align Workspaces"
 * wordmark in the editorial style of the rest of the site (serif italic
 * + sans-serif letterspaced caps).
 *
 * Output: documents/marketing/fb-banner.jpg
 *
 * Usage:
 *   npx tsx scripts/generate-fb-banner.ts
 */

import sharp from "sharp";
import { mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const IMG = (name: string) => resolve(ROOT, "client/public/images", name);
const OUT_DIR = resolve(ROOT, "documents/marketing");

const W = 2400;
const H = 1260;
const SCALE = W / 1640;
const BRAND = "#c4956a";

const px = (n: number) => Math.round(n * SCALE);

function bannerOverlaySvg(): Buffer {
  const cx = W / 2;
  const cy = H / 2;

  const accentLen = px(80);
  const accentTopY = cy - px(175);
  const accentBottomY = cy + px(130);
  const tagY = cy - px(138);
  const alignY = cy + px(10);
  const workspacesY = cy + px(80);
  const subtitleY = cy + px(175);

  return Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="vignette" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.55)" />
      <stop offset="60%" stop-color="rgba(0,0,0,0.4)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.55)" />
    </radialGradient>
  </defs>

  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#vignette)" />

  <line x1="${cx - accentLen}" y1="${accentTopY}" x2="${cx + accentLen}" y2="${accentTopY}"
        stroke="${BRAND}" stroke-width="${px(1.5)}" stroke-linecap="round" />

  <text x="${cx}" y="${tagY}"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="${px(18)}" font-weight="600" letter-spacing="${px(8)}"
        fill="${BRAND}" text-anchor="middle">
    MIAMI · BY THE HOUR
  </text>

  <text x="${cx}" y="${alignY}"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="${px(168)}" font-weight="400" letter-spacing="${px(-2)}" font-style="italic"
        fill="#ffffff" text-anchor="middle">
    Align
  </text>

  <text x="${cx}" y="${workspacesY}"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="${px(36)}" font-weight="400" letter-spacing="${px(18)}"
        fill="#ffffff" text-anchor="middle">
    WORKSPACES
  </text>

  <line x1="${cx - accentLen}" y1="${accentBottomY}" x2="${cx + accentLen}" y2="${accentBottomY}"
        stroke="${BRAND}" stroke-width="${px(1.5)}" stroke-linecap="round" />

  <text x="${cx}" y="${subtitleY}"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="${px(24)}" font-weight="400" letter-spacing="${px(2)}" font-style="italic"
        fill="rgba(255,255,255,0.85)" text-anchor="middle">
    Practice-ready workspaces for the professionals of Miami.
  </text>
</svg>`.trim());
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const outPath = resolve(OUT_DIR, "fb-banner.jpg");

  await sharp(IMG("space-therapy-bright.png"))
    .resize(W, H, { fit: "cover", position: "center", kernel: "lanczos3" })
    .composite([{ input: bannerOverlaySvg(), top: 0, left: 0 }])
    .jpeg({ quality: 95, progressive: true, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(outPath);

  console.log(`Wrote ${outPath} (${W}x${H}) for Facebook page cover.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
