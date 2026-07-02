const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'shared', 'src');
const workerDest = path.join(__dirname, 'worker-app', 'src', 'shared');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function sync() {
  console.log('Syncing shared folders...');
  if (!fs.existsSync(srcDir)) {
    console.error(`Source directory does not exist: ${srcDir}`);
    process.exit(1);
  }

  // Clear dest directories first to prevent orphaned files
  if (fs.existsSync(workerDest)) {
    fs.rmSync(workerDest, { recursive: true, force: true });
  }

  copyRecursiveSync(srcDir, workerDest);
  console.log(`Synced to worker-app: ${workerDest}`);
  console.log('Sync completed successfully.');
}

sync();

