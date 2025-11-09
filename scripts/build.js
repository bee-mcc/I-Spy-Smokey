const fs = require('fs').promises;
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

const filesToCopy = [
  { src: 'index.html', dest: 'index.html' },
  { src: path.join('css', 'style.css'), dest: path.join('css', 'style.css') },
  { src: path.join('js', 'game.js'), dest: path.join('js', 'game.js') },
  { src: path.join('js', 'level.js'), dest: path.join('js', 'level.js') },
  { src: path.join('js', 'leaderboard.js'), dest: path.join('js', 'leaderboard.js') },
];

const directoriesToCopy = [
  { src: 'assets', dest: 'assets' },
  { src: 'levels', dest: 'levels' },
];

async function removeDist() {
  await fs.rm(distDir, { recursive: true, force: true });
}

async function ensureParentDir(destPath) {
  const parentDir = path.dirname(destPath);
  if (parentDir && parentDir !== '.') {
    await fs.mkdir(parentDir, { recursive: true });
  }
}

async function copyFile(srcRelative, destRelative) {
  const srcPath = path.join(projectRoot, srcRelative);
  const destPath = path.join(distDir, destRelative);
  await ensureParentDir(destPath);
  await fs.copyFile(srcPath, destPath);
}

async function copyDirectory(srcRelative, destRelative) {
  const srcPath = path.join(projectRoot, srcRelative);
  const destPath = path.join(distDir, destRelative);
  await fs.mkdir(destPath, { recursive: true });
  const entries = await fs.readdir(srcPath, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const entrySrc = path.join(srcRelative, entry.name);
      const entryDest = path.join(destRelative, entry.name);

      if (entry.isDirectory()) {
        await copyDirectory(entrySrc, entryDest);
      } else if (entry.isFile()) {
        await copyFile(entrySrc, entryDest);
      }
    }),
  );
}

async function build() {
  await removeDist();
  await fs.mkdir(distDir, { recursive: true });

  for (const file of filesToCopy) {
    await copyFile(file.src, file.dest);
  }

  for (const dir of directoriesToCopy) {
    await copyDirectory(dir.src, dir.dest);
  }

  console.log('Game build completed. Output available in /dist.');
}

build().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});

