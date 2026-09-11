import sharp from "sharp";
import { readdir, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

async function convertDir(srcDir, destDir, { width, quality }) {
  await mkdir(destDir, { recursive: true });
  const files = (await readdir(srcDir)).filter((f) => /\.(png|jpe?g)$/i.test(f));
  let totalIn = 0;
  let totalOut = 0;
  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const base = file.replace(/\.(png|jpe?g)$/i, "");
    const destPath = path.join(destDir, `${base}.webp`);
    const inStat = await stat(srcPath);
    totalIn += inStat.size;
    await sharp(srcPath)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toFile(destPath);
    const outStat = await stat(destPath);
    totalOut += outStat.size;
  }
  console.log(
    `${srcDir} -> ${destDir}: ${files.length} files, ${(totalIn / 1024 / 1024).toFixed(2)}MB -> ${(totalOut / 1024 / 1024).toFixed(2)}MB`
  );
}

await convertDir(path.join(root, "public/gallery"), path.join(root, "public/gallery-opt"), {
  width: 1600,
  quality: 78,
});

console.log("Done.");
