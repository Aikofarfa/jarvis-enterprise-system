import { mkdir, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";

const SIZE = 1024;
const pixels = Buffer.alloc(SIZE * SIZE * 4, 0);

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const index = (y * SIZE + x) * 4;
  pixels[index] = r;
  pixels[index + 1] = g;
  pixels[index + 2] = b;
  pixels[index + 3] = a;
}

function drawCircle(cx, cy, radius, thickness, color) {
  const outer = (radius + thickness / 2) ** 2;
  const inner = (radius - thickness / 2) ** 2;
  for (let y = Math.floor(cy - radius - thickness); y <= Math.ceil(cy + radius + thickness); y += 1) {
    for (let x = Math.floor(cx - radius - thickness); x <= Math.ceil(cx + radius + thickness); x += 1) {
      const distance = (x - cx) ** 2 + (y - cy) ** 2;
      if (distance <= outer && distance >= inner) setPixel(x, y, ...color);
    }
  }
}

function drawRect(x, y, width, height, color) {
  for (let yy = y; yy < y + height; yy += 1) {
    for (let xx = x; xx < x + width; xx += 1) setPixel(xx, yy, ...color);
  }
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksumInput = Buffer.concat([typeBuffer, data]);
  let crc = 0xffffffff;
  for (const byte of checksumInput) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

const background = [8, 9, 12, 255];
const steel = [197, 208, 220, 255];
const white = [237, 242, 247, 255];
for (let y = 0; y < SIZE; y += 1) {
  for (let x = 0; x < SIZE; x += 1) setPixel(x, y, ...background);
}
drawCircle(512, 512, 274, 18, steel);
drawCircle(512, 512, 52, 14, white);
drawRect(498, 72, 28, 140, steel);
drawRect(498, 812, 28, 140, steel);
drawRect(72, 498, 140, 28, steel);
drawRect(812, 498, 140, 28, steel);

const scanlines = Buffer.alloc((SIZE * 4 + 1) * SIZE);
for (let y = 0; y < SIZE; y += 1) {
  scanlines[y * (SIZE * 4 + 1)] = 0;
  pixels.copy(scanlines, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}
const header = Buffer.alloc(13);
header.writeUInt32BE(SIZE, 0);
header.writeUInt32BE(SIZE, 4);
header[8] = 8;
header[9] = 6;
header[10] = 0;
header[11] = 0;
header[12] = 0;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", header),
  chunk("IDAT", deflateSync(scanlines, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

await mkdir("assets/images", { recursive: true });
await writeFile("assets/images/icon.png", png);
await writeFile("assets/images/android-icon-foreground.png", png);
await writeFile("assets/images/splash-icon.png", png);
console.log("Generated JARVIS PNG assets");
