const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, r, g, b) {
  // CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const typeBuf = Buffer.from(type);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const toCrc = Buffer.concat([typeBuf, data]);
    const crcVal = crc32(toCrc);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);

    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit depth
  ihdrData[9] = 2; // Color type 2: RGB
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdr = chunk('IHDR', ihdrData);

  // Scanlines: width * 3 bytes + 1 filter byte per line
  const rawData = Buffer.alloc((width * 3 + 1) * height);
  let pos = 0;

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.45;

  for (let y = 0; y < height; y++) {
    rawData[pos++] = 0; // filter type None
    for (let x = 0; x < width; x++) {
      // Create a pleasant gradient with rounded icon shield
      const dist = Math.hypot(x - cx, y - cy);
      const factor = (x + y) / (width + height);

      // Gradient from Royal Blue (59, 130, 246) to Indigo/Violet (99, 102, 241 -> 139, 92, 246)
      let pr = Math.round(59 + (139 - 59) * factor);
      let pg = Math.round(130 + (92 - 130) * factor);
      let pb = Math.round(246 + (246 - 246) * factor);

      // Inner white chat icon shape preview
      const inBox = Math.abs(x - cx) < width * 0.22 && Math.abs(y - cy) < height * 0.16;
      if (inBox && dist < radius) {
        pr = 255;
        pg = 255;
        pb = 255;
      }

      rawData[pos++] = pr;
      rawData[pos++] = pg;
      rawData[pos++] = pb;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate PNG icons
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPNG(192, 192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPNG(512, 512));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), createPNG(180, 180));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable.png'), createPNG(512, 512));
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.ico'), createPNG(32, 32));

console.log('✅ Generated PWA icons in /public/icons');
