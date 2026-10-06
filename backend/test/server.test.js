// Testes HTTP: rotas, CORS, checagem de origem, limite por IP e gzip.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { after, before, describe, test } from 'node:test';
import { createApp, readConfig } from '../src/server.js';

const ORIGIN = 'http://localhost:5173';
const BROWSER = { Origin: ORIGIN, 'User-Agent': 'Mozilla/5.0', 'Sec-Fetch-Site': 'same-site' };

async function listen(env = {})
{
  const server = createServer(createApp(readConfig({ FRONTEND_ORIGINS: ORIGIN, ...env })));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}



describe('API HTTP', () =>
{
  let server;
  let base;
  before(async () => ({ server, base } = await listen()));
  after(() => server.close());

  const post = (path, body, headers = BROWSER) => fetch(`${base}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body)
  });

  test('health responde sem checar origem', async () =>
  {
    const response = await fetch(`${base}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  });

  test('quiz responde com CORS e cache', async () =>
  {
    const response = await fetch(`${base}/api/elections/brazil-2026/quiz?variant=short&lang=en`, { headers: BROWSER });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=3600');
    const body = await response.json();
    assert.equal(body.quiz.questionCount, 36);
    assert.equal(body.quiz.answerOptions[0].label, 'Strongly agree');
  });

  test('variante padrão do quiz é a completa', async () =>
  {
    const body = await (await fetch(`${base}/api/elections/brazil-2026/quiz`, { headers: BROWSER })).json();
    assert.equal(body.quiz.variant, 'extended');
    assert.equal(body.quiz.questionCount, 60);
  });

  test('results calcula e compare valida', async () =>
  {
    const model = await (await fetch(`${base}/api/elections/brazil-2026/model`, { headers: BROWSER })).json();
    const answers = model.questions.map(question => ({ questionId: question.id, answer: 'NEUTRAL' }));
    const results = await post('/api/elections/brazil-2026/results', { modelId: model.modelId, variant: 'extreme', answers });
    assert.equal(results.status, 200);
    assert.equal((await results.json()).axes[0].candidateScores['lula-da-silva'], 75);
    const invalid = await post('/api/elections/brazil-2026/compare', { modelId: model.modelId, scores: { economia: 50 } });
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json()).status, 400);
  });

  test('JSON malformado vira 400', async () =>
  {
    const response = await fetch(`${base}/api/elections/brazil-2026/results`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...BROWSER }, body: '{'
    });
    assert.equal(response.status, 400);
  });

  test('bloqueia origem desconhecida, falta de User-Agent e de Sec-Fetch-Site', async () =>
  {
    const path = `${base}/api/elections/brazil-2026/model`;
    for (const headers of [
      { ...BROWSER, Origin: 'https://evil.example' },
      { Origin: ORIGIN, 'Sec-Fetch-Site': 'same-site', 'User-Agent': '' },
      { Origin: ORIGIN, 'User-Agent': 'Mozilla/5.0' },
      { 'User-Agent': 'Mozilla/5.0', 'Sec-Fetch-Site': 'same-site' }
    ])
    {
      assert.equal((await fetch(path, { headers })).status, 403);
    }
  });

  test('aceita Referer quando falta Origin', async () =>
  {
    const response = await fetch(`${base}/api/elections/brazil-2026/model`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Sec-Fetch-Site': 'same-origin', Referer: `${ORIGIN}/candidatos/x` }
    });
    assert.equal(response.status, 200);
  });

  test('preflight CORS só para origens permitidas', async () =>
  {
    const allowed = await fetch(`${base}/api/elections/brazil-2026/results`, {
      method: 'OPTIONS', headers: { Origin: ORIGIN, 'Access-Control-Request-Headers': 'content-type' }
    });
    assert.equal(allowed.status, 204);
    assert.equal(allowed.headers.get('access-control-allow-origin'), ORIGIN);
    assert.equal(allowed.headers.get('access-control-allow-headers'), 'content-type');
    const denied = await fetch(`${base}/api/elections/brazil-2026/results`, {
      method: 'OPTIONS', headers: { Origin: 'https://evil.example' }
    });
    assert.equal(denied.status, 403);
  });

  test('rotas desconhecidas e métodos errados', async () =>
  {
    assert.equal((await fetch(`${base}/api/quiz`, { headers: BROWSER })).status, 404);
    assert.equal((await fetch(`${base}/api/elections/brazil-2026/results`, { headers: BROWSER })).status, 405);
  });

  test('comprime JSON grande com gzip', async () =>
  {
    const response = await fetch(`${base}/api/elections/brazil-2026/model`, {
      headers: { ...BROWSER, 'Accept-Encoding': 'gzip' }
    });
    assert.equal(response.headers.get('content-encoding'), 'gzip');
    assert.equal((await response.json()).questions.length, 72);
  });
});



test('limite por IP devolve 429 com Retry-After', async () =>
{
  const { server, base } = await listen({ API_RATE_LIMIT_PER_MINUTE: '2' });
  try
  {
    const statuses = [];
    for (let index = 0; index < 3; index++)
    {
      const response = await fetch(`${base}/api/elections/brazil-2026/model`, { headers: BROWSER });
      statuses.push(response.status);
      if (response.status === 429) assert.ok(Number(response.headers.get('retry-after')) >= 1);
      await response.arrayBuffer();
    }
    assert.deepEqual(statuses, [200, 200, 429]);
    assert.equal((await fetch(`${base}/api/health`)).status, 200);
  }
  finally
  {
    server.close();
  }
});



test('API_ORIGIN_ENFORCEMENT=false libera a API', async () =>
{
  const { server, base } = await listen({ API_ORIGIN_ENFORCEMENT: 'false' });
  try
  {
    assert.equal((await fetch(`${base}/api/elections/brazil-2026/model`)).status, 200);
  }
  finally
  {
    server.close();
  }
});
