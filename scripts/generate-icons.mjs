// Generates simple placeholder PWA icons (gradient + ship silhouette) using
// only Node's built-in zlib — no image library dependency required.
// Replace these with real branded artwork before a real launch; see README.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgbaPixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = chunk('IHDR', ihdrData);

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter type: none
    rgbaPixels.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = chunk('IDAT', deflateSync(raw));
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

/** Draws a gradient square with a simple cruise-ship silhouette (hull + funnel + wave). */
function drawIcon(size, { padding = 0 } = {}) {
  const pixels = Buffer.alloc(size * size * 4);
  const c1 = hexToRgb('#0f4a70');
  const c2 = hexToRgb('#12a3f0');
  const white = [255, 255, 255];

  const contentSize = size - padding * 2;
  const hullY = 0.62 * size;
  const hullHeight = 0.1 * size;
  const hullLeft = padding + contentSize * 0.15;
  const hullRight = size - padding - contentSize * 0.15;
  const funnelWidth = contentSize * 0.08;
  const funnelX = size / 2 - funnelWidth / 2;
  const funnelTop = 0.32 * size;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * size);
      let [r, g, b] = [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
      let a = 255;

      if (padding > 0 && (x < padding || x >= size - padding || y < padding || y >= size - padding)) {
        // keep background for maskable safe-zone padding
      }

      // hull (trapezoid-ish band)
      if (y >= hullY && y <= hullY + hullHeight && x >= hullLeft && x <= hullRight) {
        [r, g, b] = white;
      }
      // funnel
      if (x >= funnelX && x <= funnelX + funnelWidth && y >= funnelTop && y <= hullY) {
        [r, g, b] = white;
      }
      // waterline wave (simple sine)
      const waveY = hullY + hullHeight + 0.03 * size * Math.sin((x / size) * Math.PI * 4);
      if (Math.abs(y - waveY) < size * 0.015 && x >= padding + contentSize * 0.05 && x <= size - padding - contentSize * 0.05) {
        [r, g, b] = white;
        a = 200;
      }

      const i = (y * size + x) * 4;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = a;
    }
  }
  return pixels;
}

function generate(size, filename, opts) {
  const pixels = drawIcon(size, opts);
  const png = encodePng(size, size, pixels);
  writeFileSync(path.join(outDir, filename), png);
  console.log(`wrote ${filename} (${size}x${size})`);
}

generate(192, 'icon-192.png');
generate(512, 'icon-512.png');
generate(192, 'icon-maskable-192.png', { padding: Math.round(192 * 0.15) });
generate(512, 'icon-maskable-512.png', { padding: Math.round(512 * 0.15) });
generate(180, 'apple-touch-icon.png');
