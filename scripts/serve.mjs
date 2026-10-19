import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root = resolve('.');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (!url.pathname.startsWith('/mietklar/')) throw new Error('not found');
    const relative = decodeURIComponent(url.pathname.slice('/mietklar/'.length)) || 'index.html';
    const path = resolve(root, relative);
    if (!path.startsWith(root + '/') || relative.split('/').some(part => part.startsWith('.'))) throw new Error('not found');
    const content = await readFile(path);
    response.writeHead(200, { 'Content-Type': (types[extname(path)] || 'application/octet-stream') + '; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(content);
  } catch { response.writeHead(404); response.end('Not found'); }
}).listen(4173, '127.0.0.1', () => console.log('mietklar test server: http://127.0.0.1:4173/mietklar/'));
