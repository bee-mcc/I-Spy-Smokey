#!/usr/bin/env node

/**
 * Rename all image files inside the `levels` directory to `pic1`, `pic2`, ...
 * preserving their original extension.
 *
 * Usage:
 *   node scripts/rename-level-images.js
 */

const fs = require('node:fs/promises');
const path = require('node:path');

const LEVELS_DIR = path.resolve(__dirname, '..', 'levels');
const TEMP_PREFIX = '__tmp_rename__';
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);

async function main() {
  const entries = await fs.readdir(LEVELS_DIR, { withFileTypes: true });

  const images = entries
    .filter((entry) => entry.isFile())
    .filter((entry) => IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  if (images.length === 0) {
    console.log('No image files found in the levels directory.');
    return;
  }

  const timestamp = Date.now();

  const renamePlan = images.map((filename, index) => {
    const extension = path.extname(filename);
    const tempName = `${TEMP_PREFIX}${timestamp}_${index}${extension}`;
    const finalName = `pic${index + 1}${extension.toLowerCase()}`;

    return {
      originalPath: path.join(LEVELS_DIR, filename),
      tempPath: path.join(LEVELS_DIR, tempName),
      finalPath: path.join(LEVELS_DIR, finalName),
    };
  });

  // First pass: rename to temporary names to avoid collisions.
  for (const item of renamePlan) {
    await fs.rename(item.originalPath, item.tempPath);
  }

  // Second pass: rename temporary files to their final names.
  for (const item of renamePlan) {
    await fs.rename(item.tempPath, item.finalPath);
  }

  console.log(`Renamed ${renamePlan.length} image(s) in ${LEVELS_DIR}.`);
}

main().catch((error) => {
  console.error('Failed to rename images:', error);
  process.exitCode = 1;
});


