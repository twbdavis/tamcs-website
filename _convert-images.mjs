import sharp from "sharp";
import { readFile, writeFile, unlink, stat } from "node:fs/promises";
import path from "node:path";

const DIR = path.resolve("public/images");
const MAX_WIDTH = 1920;
const QUALITY = 82;

const jobs = [
  { in: "IMG_2179.HEIC", out: "IMG_2179.jpg" },
  { in: "IMG_2728 (1).HEIC", out: "IMG_2728.jpg" },
  { in: "IMG_5849.HEIC", out: "IMG_5849.jpg" },
  { in: "IMG_5740.PNG", out: "IMG_5740.jpg" },
  { in: "IMG_5762.PNG", out: "IMG_5762.jpg" },
  { in: "IMG_5765.PNG", out: "IMG_5765.jpg" },
];

for (const job of jobs) {
  const inPath = path.join(DIR, job.in);
  const outPath = path.join(DIR, job.out);
  try {
    const buf = await readFile(inPath);
    const inSize = buf.byteLength;
    const out = await sharp(buf, { failOn: "none" })
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toBuffer();
    await writeFile(outPath, out);
    const { size: outSize } = await stat(outPath);
    console.log(
      `${job.in} -> ${job.out}: ${(inSize / 1024 / 1024).toFixed(2)}MB -> ${(outSize / 1024 / 1024).toFixed(2)}MB`,
    );
    await unlink(inPath);
  } catch (err) {
    console.error(`FAILED ${job.in}:`, err.message);
    process.exitCode = 1;
  }
}
