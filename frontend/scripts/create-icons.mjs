import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../public/icons');
mkdirSync(outDir, { recursive: true });

// ─── SVG sources ─────────────────────────────────────────────────────────────

const SVG_STANDARD = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#AFCBE8"/>
      <stop offset="45%" stop-color="#F3E3CC"/>
      <stop offset="100%" stop-color="#F0B49A"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <rect x="140" y="130" width="46" height="95" rx="14" fill="#1B2A38"/>
  <path d="M 92,300 L 256,166 L 420,300"
        fill="none" stroke="#1B2A38" stroke-width="54"
        stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="128" y="258" width="256" height="196" rx="42" fill="#1B2A38"/>
  <path d="M256,378
           C256,378 194,336 194,302
           C194,280 211,264 231,264
           C244,264 253,272 256,283
           C259,272 268,264 281,264
           C301,264 318,280 318,302
           C318,336 256,378 256,378 Z"
        fill="#F0B49A"/>
  <path d="M 402,84 A 52,52 0 1 0 402,188 A 40,44 0 1 1 402,84 Z"
        fill="#C99A3B"/>
</svg>`;

const SVG_MASKABLE = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#AFCBE8"/>
      <stop offset="45%" stop-color="#F3E3CC"/>
      <stop offset="100%" stop-color="#F0B49A"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <rect x="140" y="150" width="46" height="95" rx="14" fill="#1B2A38"/>
  <path d="M 92,320 L 256,186 L 420,320"
        fill="none" stroke="#1B2A38" stroke-width="54"
        stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="128" y="278" width="256" height="176" rx="42" fill="#1B2A38"/>
  <path d="M256,388
           C256,388 194,346 194,312
           C194,290 211,274 231,274
           C244,274 253,282 256,293
           C259,282 268,274 281,274
           C301,274 318,290 318,312
           C318,346 256,388 256,388 Z"
        fill="#F0B49A"/>
</svg>`;

// ─── Rasterise helpers ────────────────────────────────────────────────────────

function svgBuf(svgString) {
  return Buffer.from(svgString, 'utf8');
}

async function renderPNG(svgString, size, dest, { flatten = false } = {}) {
  let pipeline = sharp(svgBuf(svgString)).resize(size, size);
  if (flatten) {
    // iOS apple-touch-icon must be opaque — composite over solid white
    pipeline = pipeline.flatten({ background: '#FFFFFF' });
  }
  await pipeline.png().toFile(dest);
  console.log(`  ✓ ${dest.replace(outDir + '/', '')}`);
}

// favicon.ico: embed a single 32×32 PNG frame as a minimal ICO file
async function renderICO(svgString, dest) {
  const pngBuf = await sharp(svgBuf(svgString)).resize(32, 32).png().toBuffer();

  // Minimal ICO format: ICONDIR (6 bytes) + ICONDIRENTRY (16 bytes) + PNG data
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count

  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0);  // width  (0 = 256, but 32 fits in a byte)
  entry.writeUInt8(32, 1);  // height
  entry.writeUInt8(0, 2);   // color count
  entry.writeUInt8(0, 3);   // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuf.length, 8); // size of image data
  entry.writeUInt32LE(6 + 16, 12);       // offset to image data

  const ico = Buffer.concat([header, entry, pngBuf]);
  await import('fs').then(({ writeFileSync }) => writeFileSync(dest, ico));
  console.log(`  ✓ ${dest.replace(outDir + '/', '')}`);
}

// ─── Generate all icons ───────────────────────────────────────────────────────

console.log('Generating icons…');

await renderPNG(SVG_STANDARD,  192, join(outDir, 'icon-192.png'));
await renderPNG(SVG_STANDARD,  512, join(outDir, 'icon-512.png'));
await renderPNG(SVG_MASKABLE,  512, join(outDir, 'icon-512-maskable.png'));
await renderPNG(SVG_STANDARD,  180, join(outDir, 'apple-touch-icon.png'), { flatten: true });
await renderICO(SVG_STANDARD,       join(outDir, 'favicon.ico'));

console.log('Done.');
