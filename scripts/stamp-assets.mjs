import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
for (const name of readdirSync('src').filter(name => name.endsWith('.js'))) {
  const path = 'src/' + name;
  const source = readFileSync(path, 'utf8')
    .replace(/(from\s+['"])(\.\/[^'"]+\.js)(?:\?v=[^'"]*)?(['"])/g, '$1$2?v=' + version + '$3')
    .replace(/(\.\.\/data\/tarif-\d{4}\.json)(?:\?v=[^'"]*)?/g, '$1?v=' + version);
  writeFileSync(path, source);
}
const html = readFileSync('index.html', 'utf8').replace(/(\.\/(?:src\/ui\.js|style\.css))(?:\?v=[^"']*)?/g, '$1?v=' + version);
writeFileSync('index.html', html);
console.log('Browser assets versioned: ' + version);
