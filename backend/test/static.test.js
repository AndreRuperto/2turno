// Site estático servido pelo backend (deploy num serviço só) e API na mesma origem.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { loadElection } from '../src/election.js';
import { createApp, readConfig } from '../src/server.js';

describe('site estático', () =>
{
  let server;
  let base;
  let root;
  before(async () =>
  {
    root = mkdtempSync(join(tmpdir(), '2turno-dist-'));
    for (const [path, content] of Object.entries({
      'index.html': '<h1>inicio</h1>', 'en.html': '<h1>english</h1>',
      'candidatos/lula-da-silva.html': '<h1>lula</h1>', 'assets/app-abc.js': 'console.log(1)'.repeat(200),
      'favicon.ico': 'ico'
    }))
    {
      mkdirSync(join(root, path, '..'), { recursive: true });
      writeFileSync(join(root, path), content);
    }
    server = createServer(createApp(readConfig({ FRONTEND_ORIGINS: '' }), loadElection(), root));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  after(() =>
  {
    server.close();
    rmSync(root, { recursive: true, force: true });
  });

  const get = (path, headers = {}) => fetch(`${base}${path}`, { headers, redirect: 'manual' });

  test('serve páginas com URL limpa', async () =>
  {
    assert.equal(await (await get('/')).text(), '<h1>inicio</h1>');
    assert.equal(await (await get('/en')).text(), '<h1>english</h1>');
    const page = await get('/candidatos/lula-da-silva');
    assert.equal(page.headers.get('content-type'), 'text/html; charset=utf-8');
    assert.equal(await page.text(), '<h1>lula</h1>');
  });

  test('redireciona .html, barra final e URLs antigas', async () =>
  {
    for (const [from, to] of [
      ['/candidatos/lula-da-silva.html', '/candidatos/lula-da-silva'],
      ['/en/', '/en'],
      ['/personalities/flavio-bolsonaro', '/candidatos/flavio-bolsonaro'],
      ['/en/personalities/qualquer', '/en']
    ])
    {
      const response = await get(from);
      assert.equal(response.status, 308, from);
      assert.equal(response.headers.get('location'), to);
    }
  });

  test('rewrites, cache e gzip', async () =>
  {
    assert.equal(await (await get('/results')).text(), '<h1>inicio</h1>');
    const asset = await get('/assets/app-abc.js', { 'Accept-Encoding': 'gzip' });
    assert.equal(asset.headers.get('cache-control'), 'public, max-age=31536000, immutable');
    assert.equal(asset.headers.get('content-encoding'), 'gzip');
    assert.equal((await get('/favicon.ico')).headers.get('cache-control'), 'public, max-age=2592000');
  });

  test('404 e tentativa de sair da pasta', async () =>
  {
    assert.equal((await get('/nao-existe')).status, 404);
    assert.equal((await get('/..%2f..%2fpackage.json')).status, 404);
    assert.equal((await get('/%2e%2e/%2e%2e/etc/passwd')).status, 404);
  });

  test('API aceita a própria origem sem FRONTEND_ORIGINS', async () =>
  {
    const browser = { 'User-Agent': 'Mozilla/5.0', 'Sec-Fetch-Site': 'same-origin' };
    const sameOrigin = await get('/api/elections/brazil-2026/model', { ...browser, Referer: `${base}/` });
    assert.equal(sameOrigin.status, 200);
    const forwarded = await get('/api/elections/brazil-2026/model',
      { ...browser, Origin: 'https://2turno.up.railway.app', 'X-Forwarded-Host': '2turno.up.railway.app' });
    assert.equal(forwarded.status, 200);
    const other = await get('/api/elections/brazil-2026/model', { ...browser, Origin: 'https://outro.site' });
    assert.equal(other.status, 403);
  });
});
