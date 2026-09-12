/**
 * Builds the social-share image and the apple-touch icon from the committed
 * product renders, so the branded assets stay in sync with the gallery instead
 * of being separate files someone has to remember to re-export.
 *
 *   node scripts/generate-social-assets.mjs
 *
 * Outputs public/og-image.jpg (1200x630) and public/apple-touch-icon.png (180px).
 * Re-run it if the brand colours, wording or the source render change.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC = path.join(ROOT, "public");

const BRAND = "#b91c2e";
const PAPER = "#faf8f4";
const INK = "#17140f";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/** Scrim + type, composited over the product render. */
const ogOverlay = `
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}">
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0.35">
      <stop offset="0%"   stop-color="${PAPER}" stop-opacity="0.98" />
      <stop offset="52%"  stop-color="${PAPER}" stop-opacity="0.92" />
      <stop offset="78%"  stop-color="${PAPER}" stop-opacity="0.45" />
      <stop offset="100%" stop-color="${PAPER}" stop-opacity="0.15" />
    </linearGradient>
  </defs>

  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#scrim)" />
  <rect width="${OG_WIDTH}" height="8" fill="${BRAND}" />

  <text x="72" y="150" font-family="Georgia, 'Times New Roman', serif" font-style="italic"
        font-size="46" font-weight="600" fill="${BRAND}">RUSKAV</text>
  <text x="72" y="182" font-family="Helvetica, Arial, sans-serif" font-size="17"
        letter-spacing="5.5" fill="${INK}" fill-opacity="0.62">FOOD SERVICE PRODUCTS</text>

  <text x="72" y="300" font-family="Georgia, 'Times New Roman', serif" font-size="68"
        font-weight="600" fill="${INK}">Serving quality,</text>
  <text x="72" y="376" font-family="Georgia, 'Times New Roman', serif" font-size="68"
        font-weight="600" fill="${INK}">tray after tray.</text>

  <text x="72" y="447" font-family="Helvetica, Arial, sans-serif" font-size="24"
        fill="${INK}" fill-opacity="0.68">Cafeteria trays &#183; Compartment plates &#183; Dinnerware</text>
  <text x="72" y="483" font-family="Helvetica, Arial, sans-serif" font-size="24"
        fill="${INK}" fill-opacity="0.68">Drinkware &#183; Bio-composite range</text>

  <rect x="72" y="530" width="408" height="2" fill="${INK}" fill-opacity="0.14" />
  <text x="72" y="573" font-family="Helvetica, Arial, sans-serif" font-size="19"
        font-weight="bold" letter-spacing="1.6" fill="${BRAND}">FDA-APPROVED &#183; IS 10910 &#183; MADE IN INDIA</text>
</svg>`;

const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" fill="${BRAND}" />
  <text x="90" y="128" font-family="Georgia, 'Times New Roman', serif" font-style="italic"
        font-weight="600" font-size="108" fill="${PAPER}" text-anchor="middle">R</text>
</svg>`;

async function main() {
  await mkdir(PUBLIC, { recursive: true });

  // A real catalogue photograph rather than a render: the share card is often
  // the first thing a buyer sees of the product.
  const source = path.join(PUBLIC, "gallery", "tray-in-service-red.webp");

  await sharp(source)
    .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover", position: "right" })
    .composite([{ input: Buffer.from(ogOverlay), top: 0, left: 0 }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(path.join(PUBLIC, "og-image.jpg"));

  await sharp(Buffer.from(iconSvg))
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC, "apple-touch-icon.png"));

  console.log("wrote public/og-image.jpg and public/apple-touch-icon.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
