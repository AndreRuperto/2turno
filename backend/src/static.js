// Serve o build do frontend (frontend/dist):
// URLs sem .html, sem barra final, redirecionamentos antigos e cache por tipo de arquivo.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2'
};
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.xml', '.txt', '.svg']);

const REDIRECTS = [
  [/^\/personalities\/(lula-da-silva|flavio-bolsonaro)$/, match => `/candidatos/${match[1]}`],
  [/^\/en\/personalities\/(lula-da-silva|flavio-bolsonaro)$/, match => `/en/candidatos/${match[1]}`],
  [/^\/personalities(?:\/.*)?$/, () => '/'],
  [/^\/en\/personalities(?:\/.*)?$/, () => '/en']
];
const REWRITES = { '/results': '/', '/en/results': '/en', '/240questions': '/' };

function cacheControl(path)
{
  if (path.startsWith('/assets/')) return 'public, max-age=31536000, immutable';
  if (/\.(?:png|jpe?g|svg|ico|webp)$/.test(path)) return 'public, max-age=2592000';
  if (/\.css$/.test(path) || path === '/sitemap.xml' || path === '/robots.txt') return 'public, max-age=3600, s-maxage=3600, must-revalidate';
  if (/\.html$/.test(path)) return 'public, max-age=0, must-revalidate';
  return null;
}



export function defaultStaticDirectory()
{
  const directory = process.env.STATIC_DIR
    ? resolve(process.env.STATIC_DIR)
    : fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
  return existsSync(join(directory, 'index.html')) ? directory : null;
}



export function createStaticHandler(root)
{
  const base = resolve(root);
  const cache = new Map();

  // Caminho dentro de dist, ou null se sair dele ou não existir.
  function file(relative)
  {
    const absolute = normalize(join(base, relative));
    if (absolute !== base && !absolute.startsWith(base + sep)) return null;
    try
    {
      return statSync(absolute).isFile() ? absolute : null;
    }
    catch
    {
      return null;
    }
  }

  function resolvePath(path)
  {
    if (path === '/') return file('index.html');
    return file(path) ?? (extname(path) ? null : file(`${path}.html`));
  }

  function load(absolute)
  {
    let entry = cache.get(absolute);
    if (!entry)
    {
      const body = readFileSync(absolute);
      const extension = extname(absolute).toLowerCase();
      entry = { body, type: CONTENT_TYPES[extension] ?? 'application/octet-stream',
        gzip: COMPRESSIBLE.has(extension) && body.length >= 1024 ? gzipSync(body) : null };
      cache.set(absolute, entry);
    }
    return entry;
  }

  function sendFile(request, response, status, absolute, path)
  {
    const { body, type, gzip } = load(absolute);
    const useGzip = gzip && /\bgzip\b/.test(request.headers['accept-encoding'] ?? '');
    const payload = useGzip ? gzip : body;
    const headers = { 'Content-Type': type, 'Content-Length': payload.length, 'X-Content-Type-Options': 'nosniff' };
    const cache = cacheControl(absolute.endsWith('.html') && !path.endsWith('.html') ? `${path}.html` : path);
    if (cache) headers['Cache-Control'] = cache;
    if (gzip)
    {
      headers.Vary = 'Accept-Encoding';
      if (useGzip) headers['Content-Encoding'] = 'gzip';
    }
    response.writeHead(status, headers);
    response.end(request.method === 'HEAD' ? undefined : payload);
  }

  function redirect(response, location, query)
  {
    response.writeHead(308, { Location: location + query });
    response.end();
  }

  // Devolve true se respondeu; false deixa a requisição seguir (não acontece fora de /api).
  return function handleStatic(request, response)
  {
    if (request.method !== 'GET' && request.method !== 'HEAD')
    {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return true;
    }
    const url = new URL(request.url, 'http://localhost');
    let path;
    try
    {
      path = decodeURIComponent(url.pathname);
    }
    catch
    {
      path = '/';
    }
    if (path.length > 1 && path.endsWith('/')) return redirect(response, path.replace(/\/+$/, '') || '/', url.search), true;
    if (path.endsWith('.html') && path !== '/index.html')
    {
      return redirect(response, path.slice(0, -'.html'.length), url.search), true;
    }
    for (const [pattern, target] of REDIRECTS)
    {
      const match = path.match(pattern);
      if (match) return redirect(response, target(match), url.search), true;
    }
    const target = REWRITES[path] ?? path;
    const absolute = resolvePath(target);
    if (absolute)
    {
      sendFile(request, response, 200, absolute, target);
      return true;
    }
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(request.method === 'HEAD' ? undefined : 'Página não encontrada.');
    return true;
  };
}
