import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import site from '../src/site.json';

// No build, só as fotos dos candidatos e os arquivos de marca vão para o dist; o servidor de desenvolvimento espelha isso.
const assets = new Map<string, string>([
  ...site.candidates.map(candidate => [candidate.portrait, candidate.portraitSource] as [string, string]),
  ...site.brandAssets.map(asset => [asset, asset] as [string, string])
]);

export function brazilPublicPlugin(): Plugin
{
  return {
    name: 'brazil-public-assets',
    apply: 'serve',
    configureServer(server)
    {
      const root = server.config.root;
      server.middlewares.use(async (request, response, next) =>
      {
        const path = (request.url ?? '/').split('?')[0];
        const home = ['/', '/en', '/br', '/results', '/en/results', '/240questions'].includes(path);
        const asset = assets.get(path);
        const blockedAsset = path.startsWith('/personalities/portraits/') || path.startsWith('/fotos/') || path === '/logo.png';
        if (!home && !asset && !blockedAsset) return next();
        try
        {
          if (home)
          {
            const html = await readFile(join(root, 'election.html'), 'utf8');
            response.setHeader('Content-Type', 'text/html; charset=utf-8');
            response.end(await server.transformIndexHtml(path, html));
            return;
          }
          if (!asset)
          {
            response.statusCode = 404;
            response.end();
            return;
          }
          const content = await readFile(join(root, 'public', asset.slice(1)));
          const types: Record<string, string> = { png: 'image/png', ico: 'image/x-icon', webp: 'image/webp' };
          response.setHeader('Content-Type', types[asset.split('.').pop() ?? ''] ?? 'image/jpeg');
          response.end(content);
        }
        catch (failure)
        {
          next(failure);
        }
      });
    }
  };
}
