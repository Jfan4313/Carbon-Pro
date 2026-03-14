const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

try {
  const dir = path.join(process.cwd(), 'node_modules');
  if (fs.existsSync(dir)) {
    console.log('Removing node_modules...');
    fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log('Done.');
} catch (e) {
  console.error(e);
}
