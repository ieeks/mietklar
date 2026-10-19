import { readdirSync, readFileSync } from 'node:fs';
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

const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
for (const file of walk('src')) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/from\s+['"]\.\/[^'"]+\.js(\?v=[^'"]*)?['"]/g)) {
    if (match[1] !== '?v=' + version) throw new Error('Asset version mismatch: ' + file);
  }
  for (const match of source.matchAll(/\.\.\/data\/tarif-\d{4}\.json(\?v=[^'"]*)?['"]/g)) {
    if (match[1] !== '?v=' + version) throw new Error('Tariff asset version mismatch: ' + file);
  }
}
const html = readFileSync('index.html', 'utf8');
for (const path of ['./src/ui.js', './style.css']) if (!html.includes(path + '?v=' + version)) throw new Error('Entry asset version mismatch: ' + path);
console.log('Browser asset versions match package.json.');
