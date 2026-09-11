import sharp from "sharp";
import { readdir, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
// Source from the untouched original frame sequence (1920x1080), not the
// already-downsampled copy in public/frames — re-encoding a re-encode just
// compounds quality loss.
const srcDir = path.join(root, "..", "Products Images");
const destDir = path.join(root, "public/frames-opt");

await mkdir(destDir, { recursive: true });
const files = (await readdir(srcDir)).filter((f) => /\.jpe?g$/i.test(f));
let totalIn = 0;
let totalOut = 0;

for (const file of files) {
  const srcPath = path.join(srcDir, file);
  const match = file.match(/(\d+)/);
  const num = match ? match[1].padStart(3, "0") : file;
  const destPath = path.join(destDir, `frame-${num}.webp`);
  const inStat = await stat(srcPath);
  totalIn += inStat.size;
  // The source frames are soft (extracted from compressed video at 4:2:0), so
  // detail can't be recovered — but two things make them read as sharp:
  // upscaling past 1920 with lanczos3 means the canvas barely has to scale on
  // a HiDPI viewport, and an unsharp pass restores the edge definition the
  // source compression ate.
  await sharp(srcPath)
    .resize({ width: 2560, kernel: "lanczos3" })
    .sharpen({ sigma: 1.1, m1: 0.5, m2: 2.0 })
    .webp({ quality: 82 })
    .toFile(destPath);
  const outStat = await stat(destPath);
  totalOut += outStat.size;
}

console.log(
  `${files.length} frames: ${(totalIn / 1024 / 1024).toFixed(2)}MB -> ${(totalOut / 1024 / 1024).toFixed(2)}MB`
);
