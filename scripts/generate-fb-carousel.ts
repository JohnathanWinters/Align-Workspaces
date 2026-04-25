/**
 * Generates 3 Facebook-ready carousel slides (1080x1080) for the
 * "List Your Space" host-acquisition campaign.
 *
 * Slide 1: Hook photo (modern coaching room), no overlay.
 * Slide 2: Marketplace path, text overlay on warm therapy room.
 * Slide 3: Studio Software path, text overlay on photo studio.
 *
 * Output: documents/marketing/fb-carousel/slide-{1,2,3}.jpg
 *
 * Usage:
 *   npx tsx scripts/generate-fb-carousel.ts
 */

import sharp from "sharp";
import { mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const IMG = (name: string) => resolve(ROOT, "client/public/images", name);
const OUT_DIR = resolve(ROOT, "documents/marketing/fb-carousel");
const SIZE = 1080;
const BRAND = "#c4956a";

interface Overlay {
  badge: string;
  headlineLines: string[];
  subhead: string;
  badgeBg: string;
  accentBar: string;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function overlaySvg({ badge, headlineLines, subhead, badgeBg, accentBar }: Overlay): Buffer {
  const headlineFontSize = 64;
  const lineHeight = headlineFontSize * 1.05;
  const blockHeight = headlineLines.length * lineHeight + 180;
  const blockTop = SIZE - blockHeight - 60;

  const headlineBaselineY = blockTop + 130;
  const headlineTspans = headlineLines
    .map((line, i) =>
      `<tspan x="96" ${i === 0 ? "" : `dy="${lineHeight}"`}>${escapeXml(line)}</tspan>`
    )
    .join("");

  const subheadY = headlineBaselineY + (headlineLines.length - 1) * lineHeight + 56;
  const urlY = subheadY + 60;
  const accentBarHeight = urlY - (blockTop + 30);

  const badgeText = badge.toUpperCase();
  const badgeWidth = badgeText.length * 13 + 64;

  return Buffer.from(`
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="darken" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0)" />
      <stop offset="40%" stop-color="rgba(0,0,0,0.1)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.88)" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${SIZE}" height="${SIZE}" fill="url(#darken)" />
  <rect x="64" y="${blockTop + 30}" width="6" height="${accentBarHeight}" fill="${accentBar}" rx="3" />
  <rect x="96" y="${blockTop + 30}" width="${badgeWidth}" height="44" rx="22" fill="${badgeBg}" />
  <text x="${96 + badgeWidth / 2}" y="${blockTop + 60}"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="18" font-weight="700" letter-spacing="3"
        fill="#ffffff" text-anchor="middle">${escapeXml(badgeText)}</text>
  <text y="${headlineBaselineY}"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="${headlineFontSize}" font-weight="500" letter-spacing="-1"
        fill="#ffffff">${headlineTspans}</text>
  <text x="96" y="${subheadY}"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="28" font-weight="400"
        fill="rgba(255,255,255,0.88)">${escapeXml(subhead)}</text>
  <text x="96" y="${urlY}"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="20" font-weight="600" letter-spacing="2"
        fill="${BRAND}">ALIGNWORKSPACES.COM/HOST</text>
</svg>`.trim());
}

async function brandStripeSvg(): Promise<Buffer> {
  const svg = `
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0.5)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0)" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${SIZE}" height="160" fill="url(#topShade)" />
  <text x="64" y="80"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="36" font-weight="500" letter-spacing="2"
        fill="#ffffff">
    ALIGN
  </text>
  <text x="64" y="115"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="16" font-weight="500" letter-spacing="3"
        fill="rgba(255,255,255,0.7)">
    WORKSPACES · MIAMI
  </text>
</svg>`.trim();
  return Buffer.from(svg);
}

interface CenteredOverlay {
  badge: string;
  headlineLines: string[];
  subhead: string;
  url: string;
  badgeBg: string;
}

function centeredOverlaySvg({ badge, headlineLines, subhead, url, badgeBg }: CenteredOverlay): Buffer {
  const headlineFontSize = 70;
  const lineHeight = headlineFontSize * 1.05;
  const subheadFontSize = 26;
  const urlFontSize = 18;
  const badgeHeight = 44;
  const gapAboveHeadline = 28;
  const gapBelowHeadline = 28;
  const gapBeforeUrl = 28;

  const blockHeight =
    badgeHeight +
    gapAboveHeadline +
    headlineLines.length * lineHeight +
    gapBelowHeadline +
    subheadFontSize +
    gapBeforeUrl +
    urlFontSize;

  const blockTop = (SIZE - blockHeight) / 2;

  const badgeText = badge.toUpperCase();
  const badgeWidth = badgeText.length * 13 + 64;
  const badgeY = blockTop;

  const firstHeadlineBaselineY = badgeY + badgeHeight + gapAboveHeadline + headlineFontSize * 0.85;
  const headlineTspans = headlineLines
    .map((line, i) =>
      `<tspan x="${SIZE / 2}" text-anchor="middle" ${i === 0 ? "" : `dy="${lineHeight}"`}>${escapeXml(line)}</tspan>`
    )
    .join("");

  const subheadY = firstHeadlineBaselineY + (headlineLines.length - 1) * lineHeight + gapBelowHeadline + subheadFontSize;
  const urlY = subheadY + gapBeforeUrl + urlFontSize;

  return Buffer.from(`
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${SIZE}" height="${SIZE}" fill="rgba(0,0,0,0.5)" />
  <rect x="${(SIZE - badgeWidth) / 2}" y="${badgeY}" width="${badgeWidth}" height="${badgeHeight}" rx="22" fill="${badgeBg}" />
  <text x="${SIZE / 2}" y="${badgeY + 30}"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="18" font-weight="700" letter-spacing="3"
        fill="#ffffff" text-anchor="middle">${escapeXml(badgeText)}</text>
  <text y="${firstHeadlineBaselineY}"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="${headlineFontSize}" font-weight="500" letter-spacing="-1"
        fill="#ffffff">${headlineTspans}</text>
  <text x="${SIZE / 2}" y="${subheadY}"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="${subheadFontSize}" font-weight="400"
        fill="rgba(255,255,255,0.9)" text-anchor="middle">${escapeXml(subhead)}</text>
  <text x="${SIZE / 2}" y="${urlY}"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="${urlFontSize}" font-weight="600" letter-spacing="2"
        fill="${BRAND}" text-anchor="middle">${escapeXml(url)}</text>
</svg>`.trim());
}

async function makeSlide(
  sourcePath: string,
  outPath: string,
  overlay: Buffer | null,
  includeBrandStripe: boolean
): Promise<void> {
  const composites: sharp.OverlayOptions[] = [];

  if (includeBrandStripe) {
    composites.push({ input: await brandStripeSvg(), top: 0, left: 0 });
  }

  if (overlay) {
    composites.push({ input: overlay, top: 0, left: 0 });
  }

  await sharp(sourcePath)
    .resize(SIZE, SIZE, { fit: "cover", position: "center" })
    .composite(composites)
    .jpeg({ quality: 90, progressive: true })
    .toFile(outPath);

  console.log(`  Wrote ${outPath}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Generating Facebook carousel slides → ${OUT_DIR}\n`);

  await makeSlide(
    IMG("space-therapy-2.png"),
    resolve(OUT_DIR, "slide-1.jpg"),
    centeredOverlaySvg({
      badge: "For Miami space owners",
      headlineLines: ["Two ways your", "space can earn."],
      subhead: "Pick the model that fits your business.",
      url: "ALIGNWORKSPACES.COM/HOST",
      badgeBg: BRAND,
    }),
    false
  );

  await makeSlide(
    IMG("space-therapy-1.png"),
    resolve(OUT_DIR, "slide-2.jpg"),
    overlaySvg({
      badge: "Marketplace",
      headlineLines: ["List free.", "We bring clients."],
      subhead: "Pay 12.5% only when you actually get booked.",
      badgeBg: "#047857",
      accentBar: "#047857",
    }),
    false
  );

  await makeSlide(
    IMG("space-meeting-2.png"),
    resolve(OUT_DIR, "slide-3.jpg"),
    overlaySvg({
      badge: "Studio Software",
      headlineLines: ["$29/mo.", "Keep 100%."],
      subhead: "Already have clients? Run them under your brand.",
      badgeBg: BRAND,
      accentBar: BRAND,
    }),
    false
  );

  console.log(`\nDone. Upload these 3 files to Facebook in order.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
