const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_ICON = path.join(ROOT, 'public/logos/jiivaakart-icon.png');

async function renderSquircleIcon(size, options = {}) {
  const { rxRatio = 0.2, scaleRatio = 0.86 } = options;
  const rx = Math.max(2, Math.round(size * rxRatio));

  // Crisp white rounded container
  const svgBg = Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${rx}" ry="${rx}" fill="#FFFFFF" />
    </svg>
  `);

  // Trim icon transparency so it is centered precisely
  const trimmedBuf = await sharp(SOURCE_ICON).trim().toBuffer();
  const meta = await sharp(trimmedBuf).metadata();

  const targetH = Math.max(1, Math.round(size * scaleRatio));
  const targetW = Math.max(1, Math.round(targetH * (meta.width / meta.height)));

  const resizedLogo = await sharp(trimmedBuf)
    .resize(targetW, targetH, { fit: 'contain', kernel: sharp.kernel.lanczos3 })
    .toBuffer();

  const left = Math.round((size - targetW) / 2);
  const top = Math.round((size - targetH) / 2);

  return sharp(svgBg)
    .composite([{ input: resizedLogo, left, top }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = count * dirEntrySize;
  let currentOffset = headerSize + dirSize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4); // count

  const dirEntries = [];
  for (const img of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0); // width
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(img.buffer.length, 8); // size
    entry.writeUInt32LE(currentOffset, 12); // offset
    dirEntries.push(entry);
    currentOffset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map((b) => b.buffer)]);
}

async function main() {
  console.log(
    'Generating high-contrast JiivaaKart brand favicons with white rounded background...',
  );

  const filesToGenerate = [
    { dest: 'public/favicon-16x16.png', size: 16 },
    { dest: 'public/favicon-32x32.png', size: 32 },
    { dest: 'public/favicon-48x48.png', size: 48 },
    { dest: 'public/favicon-96x96.png', size: 96 },
    { dest: 'public/favicon-144x144.png', size: 144 },
    { dest: 'public/apple-touch-icon.png', size: 180 },
    { dest: 'src/app/apple-icon.png', size: 180 },
    { dest: 'public/icons/icon-192x192.png', size: 192 },
    { dest: 'public/icons/icon-512x512.png', size: 512 },
    { dest: 'src/app/icon.png', size: 512 },
  ];

  for (const item of filesToGenerate) {
    const fullPath = path.join(ROOT, item.dest);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    const buf = await renderSquircleIcon(item.size);
    fs.writeFileSync(fullPath, buf);
    console.log(`✓ Generated ${item.dest} (${item.size}x${item.size}) - ${buf.length} bytes`);
  }

  // Generate multi-resolution ICO (16, 32, 48, 64, 128, 256)
  const icoSizes = [16, 32, 48, 64, 128, 256];
  const icoBuffers = [];
  for (const size of icoSizes) {
    const buffer = await renderSquircleIcon(size);
    icoBuffers.push({ size, buffer });
  }

  const icoBuffer = buildIco(icoBuffers);
  fs.writeFileSync(path.join(ROOT, 'public/favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(ROOT, 'src/app/favicon.ico'), icoBuffer);
  console.log(
    `✓ Generated public/favicon.ico & src/app/favicon.ico (${icoSizes.join(', ')} px) - ${icoBuffer.length} bytes`,
  );

  console.log('All favicons successfully generated with white rounded container!');
}

main().catch((err) => {
  console.error('Fatal error generating favicons:', err);
  process.exit(1);
});
