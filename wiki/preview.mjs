// Optional local preview. The documentation also works by opening index.html.
import http from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(fileURLToPath(new URL('.', import.meta.url)));
const port = Number(process.env.PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.md':'text/plain; charset=utf-8'};
const server = http.createServer(async (req, res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405,{'Allow':'GET, HEAD'}); res.end(); return; }
    const url = new URL(req.url, 'http://127.0.0.1');
    const requested = decodeURIComponent(url.pathname);
    const candidate = path.resolve(root, `.${requested}`, requested.endsWith('/') ? 'index.html' : '');
    const file = await realpath(candidate);
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative) || !(await stat(file)).isFile()) throw new Error('Not found');
    const data = await readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream','Content-Length':data.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}); res.end('File not found'); }
});
server.on('error',error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} is in use. Set PORT to another port and retry.` : error.message); process.exitCode=1; });
server.listen(port,'127.0.0.1',()=>console.log(`Documentation preview: http://127.0.0.1:${port}\nPress Ctrl+C to stop.`));
