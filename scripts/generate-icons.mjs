import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");
const imagesDir = path.join(publicDir, "images");
const sourcePath = path.join(imagesDir, "block-logo-maroon.png");

const pngOpts = { compressionLevel: 9 };
const transparentBg = { r: 0, g: 0, b: 0, alpha: 0 };

async function resizePng(size, outName) {
  await sharp(sourcePath, { failOn: "none" })
    .resize(size, size, { fit: "contain", background: transparentBg })
    .png(pngOpts)
    .toFile(path.join(publicDir, outName));
  console.log(`wrote public/${outName}`);
}

await resizePng(180, "apple-touch-icon.png");
await resizePng(192, "icon-192.png");
await resizePng(512, "icon-512.png");

const png32 = await sharp(sourcePath, { failOn: "none" })
  .resize(32, 32, { fit: "contain", background: transparentBg })
  .png(pngOpts)
  .toBuffer();

const ico = Buffer.alloc(6 + 16 + png32.length);
ico.writeUInt16LE(0, 0);
ico.writeUInt16LE(1, 2);
ico.writeUInt16LE(1, 4);
ico.writeUInt8(32, 6);
ico.writeUInt8(32, 7);
ico.writeUInt8(0, 8);
ico.writeUInt8(0, 9);
ico.writeUInt16LE(1, 10);
ico.writeUInt16LE(32, 12);
ico.writeUInt32LE(png32.length, 14);
ico.writeUInt32LE(22, 18);
png32.copy(ico, 22);

fs.writeFileSync(path.join(publicDir, "favicon.ico"), ico);
console.log("wrote public/favicon.ico");
