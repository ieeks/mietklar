import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? walk(directory + '/' + entry.name) : /\.(?:mjs|js)$/.test(entry.name) ? [directory + '/' + entry.name] : []);
}
const files = ['src', 'tests', 'scripts', 'e2e'].flatMap(walk).concat('playwright.config.js');
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('Syntax checked: ' + files.length + ' JavaScript files.');
