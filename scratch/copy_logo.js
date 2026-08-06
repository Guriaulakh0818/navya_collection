const fs = require('fs');
const path = require('path');

const sourcePath =
  'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\74dc9e4e-ab73-43b8-aa15-ac3f9802a9a4\\media__1786002376903.jpg';
const targetDir = 'd:\\disk d\\Navya Collection Website\\public\\images';

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.copyFileSync(sourcePath, path.join(targetDir, 'navya-logo.png'));
fs.copyFileSync(sourcePath, path.join(targetDir, 'navya-logo.jpg'));

console.log(
  '✅ Navya Collection NC Logo copied successfully to public/images/navya-logo.png and navya-logo.jpg!',
);
