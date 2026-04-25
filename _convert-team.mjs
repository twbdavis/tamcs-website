import sharp from "sharp";
import { readFile, writeFile, unlink, stat } from "node:fs/promises";
import path from "node:path";

const DIR = path.resolve("public/images");
const inPath = path.join(DIR, "Team Picture.jpg");
const outPath = path.join(DIR, "Team_Picture.jpg");

const buf = await readFile(inPath);
const inSize = buf.byteLength;
const out = await sharp(buf)
  .rotate()
  .resize({ width: 1920, withoutEnlargement: true })
  .jpeg({ quality: 85, mozjpeg: true })
  .toBuffer();
await writeFile(outPath, out);
const { size: outSize } = await stat(outPath);
console.log(
  `Team Picture.jpg -> Team_Picture.jpg: ${(inSize / 1024 / 1024).toFixed(2)}MB -> ${(outSize / 1024 / 1024).toFixed(2)}MB`,
);
await unlink(inPath);
