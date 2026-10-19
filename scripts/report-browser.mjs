// CI-only diagnostic transport. All pages use the public fictitious fixtures.
// This allows inspecting the screenshot even without a local browser runtime.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? walk(directory + '/' + entry.name) : [directory + '/' + entry.name]);
}
const files = walk('test-results');
files.filter(path => path.endsWith('error-context.md')).forEach(path => console.log('BROWSER_CONTEXT ' + path + '\n' + readFileSync(path, 'utf8').slice(0, 12000)));
const screenshot = files.find(path => path.includes('chromium') && path.endsWith('/mobile.png'));
if (screenshot) console.log('QA_MOBILE_PNG=' + readFileSync(screenshot).toString('base64'));
