/**
 * build.js — Copies source files to dist/ for distribution.
 * This is a simple build step for sharing the database package.
 *
 * Usage: npm run build
 */
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const DIST_DIR = path.join(__dirname, '..', 'dist');

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Clean dist
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// Copy src → dist
copyRecursive(SRC_DIR, DIST_DIR);

// Copy SQL files to dist
const sqlFiles = ['schema.sql', 'seed.sql', 'queries.sql'];
for (const file of sqlFiles) {
  const srcPath = path.join(__dirname, '..', file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, path.join(DIST_DIR, file));
  }
}

console.log('✅ Build complete. Output in dist/');
