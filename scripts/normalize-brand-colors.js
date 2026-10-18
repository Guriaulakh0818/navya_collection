const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'src');

const replacements = [
  // 1. Replace legacy 0A2342 with official Royal Navy 183A73
  { from: /#0A2342/gi, to: '#183A73' },
  // 2. Replace legacy deep navy 051329 and 061527 with Midnight Navy 09172E
  { from: /#051329/gi, to: '#09172E' },
  { from: /#061527/gi, to: '#09172E' },
  // 3. Replace legacy F28C28 with official Sunset Orange F15A25
  { from: /#F28C28/gi, to: '#F15A25' },

  // 4. Normalize Tailwind arbitrary class brackets in JSX/TSX
  { from: /\btext-\[#183A73\]/g, to: 'text-navy' },
  { from: /\bbg-\[#183A73\]\/10/g, to: 'bg-navy/10' },
  { from: /\bbg-\[#183A73\]\/90/g, to: 'bg-navy-700' },
  { from: /\bbg-\[#183A73\]/g, to: 'bg-navy' },
  { from: /\bborder-\[#183A73\]/g, to: 'border-navy' },
  { from: /\bring-\[#183A73\]/g, to: 'ring-navy' },
  { from: /\bhover:text-\[#183A73\]/g, to: 'hover:text-navy' },
  { from: /\bhover:bg-\[#183A73\]/g, to: 'hover:bg-navy-700' },

  { from: /\btext-\[#F15A25\]\/80/g, to: 'text-orange-700' },
  { from: /\btext-\[#F15A25\]/g, to: 'text-orange' },
  { from: /\bbg-\[#F15A25\]\/90/g, to: 'bg-orange-600' },
  { from: /\bbg-\[#F15A25\]/g, to: 'bg-orange' },
  { from: /\bborder-\[#F15A25\]/g, to: 'border-orange' },
  { from: /\bring-\[#F15A25\]/g, to: 'ring-orange' },
  { from: /\bhover:text-\[#F15A25\]/g, to: 'hover:text-orange-600' },
  { from: /\bhover:bg-\[#F15A25\]/g, to: 'hover:bg-orange-600' },
];

let modifiedCount = 0;

function processFile(filePath) {
  // Skip test files, images, generated files
  if (!/\.(tsx|ts|jsx|js|css)$/.test(filePath)) return;
  if (filePath.includes('__tests__') || filePath.includes('.test.')) return;

  const original = fs.readFileSync(filePath, 'utf8');
  let updated = original;

  for (const { from, to } of replacements) {
    updated = updated.replace(from, to);
  }

  if (updated !== original) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`✓ Updated: ${path.relative(ROOT, filePath)}`);
    modifiedCount++;
  }
}

function walk(dir) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        walk(full);
      }
    } else {
      processFile(full);
    }
  }
}

console.log('Running brand color normalization across src/ ...');
walk(ROOT);
console.log(`Finished! Total files normalized: ${modifiedCount}`);
