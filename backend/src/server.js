// API do 2 Turno: Node puro (node:http), sem dependências.
import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { HttpError, loadElection } from './election.js';
import { createStaticHandler, defaultStaticDirectory } from './static.js';

const ELECTION_PREFIX = '/api/elections/brazil-2026';
const HEALTH_PATH = '/api/health';
const MAX_BODY_BYTES = 64 * 1024;
const RATE_WINDOW_MILLIS = 60_000;
const RATE_PURGE_THRESHOLD = 20_000;

const STATUS_TEXT = { 400: 'Bad Request', 403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed',
  413: 'Payload Too Large', 429: 'Too Many Requests', 500: 'Internal Server Error' };

function flag(value, fallback)
{
  return value === undefined || value === '' ? fallback : value.trim().toLowerCase() !== 'false';
}



function integer(value, fallback)
{
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}



function normalizeOrigin(origin)
{
  return origin.trim().replace(/\/+$/, '').toLowerCase();
}



function originOf(url)
{
  try
  {
    const parsed = new URL(url);
    return parsed.host ? normalizeOrigin(`${parsed.protocol}//${parsed.host}`) : '';
  }
  catch
  {
    return '';
  }
}



export function readConfig(env = process.env)
{
  const origins = (env.FRONTEND_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',').map(origin => origin.trim()).filter(Boolean);
  return {
    port: integer(env.PORT, 8080),
    allowedOrigins: new Set(origins.map(normalizeOrigin)),
    originEnforcement: flag(env.API_ORIGIN_ENFORCEMENT, true),
    requireFetchMetadata: flag(env.API_REQUIRE_FETCH_METADATA, true),
    accessSampleEvery: integer(env.API_ACCESS_SAMPLE_EVERY, 200),
    rateLimitEnabled: flag(env.API_RATE_LIMIT_ENABLED, true),
    requestsPerMinute: integer(env.API_RATE_LIMIT_PER_MINUTE, 240)
  };
}



// O proxy da hospedagem põe o IP real no primeiro salto do X-Forwarded-For.
function clientIp(request)
{
  const forwarded = request.headers['x-forwarded-for'];
  return forwarded ? forwarded.split(',')[0].trim() : request.socket.remoteAddress;
}



export function createApp(config = readConfig(), election = loadElection(), staticDirectory = defaultStaticDirectory())
{
  const handleStatic = staticDirectory ? createStaticHandler(staticDirectory) : null;
  const windows = new Map();
  let acceptedCount = 0;

  function send(request, response, status, body, headers = {})
  {
    let payload = Buffer.from(JSON.stringify(body));
    const outgoing = { 'Content-Type': 'application/json; charset=utf-8', ...headers };
    if (payload.length >= 1024 && /\bgzip\b/.test(request.headers['accept-encoding'] ?? ''))
    {
      payload = gzipSync(payload);
      outgoing['Content-Encoding'] = 'gzip';
      outgoing.Vary = outgoing.Vary ? `${outgoing.Vary}, Accept-Encoding` : 'Accept-Encoding';
    }
    outgoing['Content-Length'] = payload.length;
    response.writeHead(status, outgoing);
    response.end(request.method === 'HEAD' ? undefined : payload);
  }

  function sendError(request, response, status, message, headers = {})
  {
    send(request, response, status, {
      timestamp: new Date().toISOString(),
      status,
      error: STATUS_TEXT[status] ?? 'Error',
      message,
      path: new URL(request.url, 'http://localhost').pathname
    }, headers);
  }

  // Janela fixa de 1 minuto por IP, em memória (cada instância conta separado).
  function rateLimitRetryMillis(request, now)
  {
    if (windows.size > RATE_PURGE_THRESHOLD)
    {
      for (const [key, window] of windows) if (now - window.startedAt > 2 * RATE_WINDOW_MILLIS) windows.delete(key);
    }
    const key = clientIp(request);
    let window = windows.get(key);
    if (!window || now - window.startedAt >= RATE_WINDOW_MILLIS)
    {
      window = { startedAt: now, count: 0 };
      windows.set(key, window);
    }
    if (window.count < config.requestsPerMinute)
    {
      window.count++;
      return 0;
    }
    return window.startedAt + RATE_WINDOW_MILLIS - now;
  }

  // Quando o próprio backend serve o site, a página e a API têm a mesma origem.
  function allowedOrigin(origin, request)
  {
    if (!origin) return false;
    if (config.allowedOrigins.has(origin)) return true;
    const host = (request.headers['x-forwarded-host'] ?? request.headers.host ?? '').split(',')[0].trim().toLowerCase();
    return host !== '' && origin.replace(/^https?:\/\//, '') === host;
  }

  // Origin pode ser forjado por um cliente de servidor: isto é barreira, não tranca. Exigir também
  // User-Agent e Sec-Fetch-Site (todo navegador moderno manda) encarece quem forja só o Origin.
  function originBlockReason(request)
  {
    if (!config.originEnforcement) return null;
    if (!request.headers['user-agent']?.trim()) return 'no_user_agent';
    const origin = request.headers.origin;
    if (origin?.trim())
    {
      if (!allowedOrigin(normalizeOrigin(origin), request)) return 'origin_not_allowed';
    }
    else if (!allowedOrigin(originOf(request.headers.referer ?? ''), request))
    {
      return 'no_origin';
    }
    if (config.requireFetchMetadata && !request.headers['sec-fetch-site']?.trim()) return 'no_fetch_metadata';
    return null;
  }

  function describe(request, path)
  {
    const headers = request.headers;
    return `path=${path} ip=${clientIp(request)} userAgent=${headers['user-agent']} origin=${headers.origin} `
      + `referer=${headers.referer} secFetchSite=${headers['sec-fetch-site']}`;
  }

  function corsHeaders(request)
  {
    const origin = request.headers.origin;
    return origin && config.allowedOrigins.has(normalizeOrigin(origin))
      ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
  }

  function readBody(request)
  {
    return new Promise((resolve, reject) =>
    {
      const chunks = [];
      let size = 0;
      request.on('data', chunk =>
      {
        size += chunk.length;
        if (size > MAX_BODY_BYTES)
        {
          reject(new HttpError(413, 'Corpo da requisição grande demais.'));
          request.destroy();
          return;
        }
        chunks.push(chunk);
      });
      request.on('end', () =>
      {
        try
        {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        }
        catch
        {
          reject(new HttpError(400, 'JSON inválido.'));
        }
      });
      request.on('error', reject);
    });
  }

  async function route(request, path, query)
  {
    const language = query.get('lang') ?? 'pt';
    const get = request.method === 'GET' || request.method === 'HEAD';
    if (get && path === `${ELECTION_PREFIX}/model`) return election.getModel(language);
    if (get && path === `${ELECTION_PREFIX}/quiz`) return election.getQuiz(query.get('variant') ?? 'extended', language);
    if (request.method === 'POST' && path === `${ELECTION_PREFIX}/results`) return election.score(await readBody(request), language);
    if (request.method === 'POST' && path === `${ELECTION_PREFIX}/compare`) return election.compare(await readBody(request), language);
    const known = ['model', 'quiz', 'results', 'compare'].some(name => path === `${ELECTION_PREFIX}/${name}`);
    throw new HttpError(known ? 405 : 404, known ? 'Método não permitido.' : 'Recurso não encontrado.');
  }

  return async function handle(request, response)
  {
    const url = new URL(request.url, 'http://localhost');
    const path = url.pathname.replace(/\/+$/, '') || '/';
    try
    {
      if (path === HEALTH_PATH) return send(request, response, 200, { status: 'ok' });
      if (!path.startsWith('/api/'))
      {
        if (handleStatic) return handleStatic(request, response);
        throw new HttpError(404, 'Recurso não encontrado.');
      }

      // Preflight CORS: barato e vem junto de cada POST legítimo, então não passa pelos limites.
      if (request.method === 'OPTIONS')
      {
        const cors = corsHeaders(request);
        if (!cors['Access-Control-Allow-Origin']) throw new HttpError(403, 'Origem não permitida.');
        response.writeHead(204, {
          ...cors,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': request.headers['access-control-request-headers'] ?? '*',
          'Access-Control-Max-Age': '3600'
        });
        return response.end();
      }

      if (config.rateLimitEnabled)
      {
        const retryMillis = rateLimitRetryMillis(request, Date.now());
        if (retryMillis > 0)
        {
          console.warn(`API_RATE_LIMITED limit=${config.requestsPerMinute}/min ${describe(request, path)}`);
          return send(request, response, 429,
            { error: 'too_many_requests', message: 'Muitas requisições. Tente de novo em instantes.' },
            { 'Retry-After': String(Math.max(1, Math.ceil(retryMillis / 1000))) });
        }
      }

      const blockReason = originBlockReason(request);
      if (blockReason)
      {
        console.warn(`API_ORIGIN_BLOCKED reason=${blockReason} ${describe(request, path)}`);
        return send(request, response, 403, { error: 'forbidden', message: 'API de uso exclusivo do site 2 Turno.' });
      }
      if (config.accessSampleEvery > 0 && ++acceptedCount % config.accessSampleEvery === 0)
      {
        console.info(`API_ACCESS_SAMPLE ${describe(request, path)}`);
      }

      const body = await route(request, path, url.searchParams);
      // GETs são determinísticos (dados estáticos), então o navegador pode reaproveitar por 1 hora.
      const cache = request.method === 'GET' ? { 'Cache-Control': 'public, max-age=3600' } : {};
      return send(request, response, 200, body, { ...corsHeaders(request), ...cache });
    }
    catch (error)
    {
      if (error instanceof HttpError) return sendError(request, response, error.status, error.message, corsHeaders(request));
      console.error(error);
      return sendError(request, response, 500, 'Erro interno.', corsHeaders(request));
    }
  };
}



export function startServer(config = readConfig())
{
  const server = createServer(createApp(config));
  server.listen(config.port, () =>
  {
    console.info(`2 Turno em http://localhost:${config.port}`);
    const site = defaultStaticDirectory();
    console.info(site ? `Servindo o site de ${site}` : 'Sem frontend/dist: servindo só a API');
    if (!config.originEnforcement) console.warn('API_ORIGIN_ENFORCEMENT=false: /api/** está aberto');
    else console.info(`Origens permitidas: ${[...config.allowedOrigins].join(', ')}`);
  });
  const stop = () => server.close(() => process.exit(0));
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  return server;
}



if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href)
{
  startServer();
}
