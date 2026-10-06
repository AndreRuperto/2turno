// Sobe backend (8080) e frontend (5173) juntos; Ctrl+C derruba os dois.
// Uso, na raiz do repositório:
//   npm run dev               backend local + frontend
//   npm run dev -- --prod-api só o frontend, usando a API de produção
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { connect } from 'node:net';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const windows = process.platform === 'win32';
const productionApi = 'https://one2axes-backend.onrender.com';
const useProductionApi = process.argv.includes('--prod-api');
const children = [];

function fail(message)
{
  console.error(`\n[dev] ${message}\n`);
  process.exit(1);
}



function portOpen(port)
{
  return new Promise(done =>
  {
    const socket = connect({ port, host: '127.0.0.1' });
    socket.once('connect', () => { socket.destroy(); done(true); });
    socket.once('error', () => done(false));
  });
}



async function waitForPort(port, child, seconds)
{
  for (let elapsed = 0; elapsed < seconds; elapsed++)
  {
    if (await portOpen(port)) return;
    if (child.exitCode !== null) fail('O backend parou antes de subir. Veja as linhas [api] acima.');
    await new Promise(next => setTimeout(next, 1000));
  }
  fail(`O backend não respondeu na porta ${port} em ${seconds}s.`);
}



function start(label, command, args, cwd, env = {})
{
  // .cmd no Windows só roda via shell; o caminho vai entre aspas por causa de espaços.
  const executable = windows && /\s/.test(command) ? `"${command}"` : command;
  const child = spawn(executable, args, { cwd, shell: windows, env: { ...process.env, ...env } });
  const prefix = line => line && process.stdout.write(`[${label}] ${line}\n`);
  for (const stream of [child.stdout, child.stderr])
  {
    let buffer = '';
    stream.on('data', chunk =>
    {
      const lines = (buffer + chunk).split(/\r?\n/);
      buffer = lines.pop();
      lines.forEach(prefix);
    });
  }
  child.on('exit', code =>
  {
    if (!stopping) console.log(`[dev] ${label} saiu (código ${code}).`);
    stop(code ?? 0);
  });
  children.push(child);
  return child;
}



let stopping = false;

function stop(code = 0)
{
  if (stopping) return;
  stopping = true;
  for (const child of children)
  {
    if (child.exitCode !== null) continue;
    // npm abre subprocessos (node, vite); no Windows só o taskkill /T derruba a árvore.
    if (windows) spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else child.kill('SIGINT');
  }
  process.exit(code);
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

if (!existsSync(join(root, 'frontend', 'node_modules')))
{
  console.log('[dev] Instalando dependências do frontend (só na primeira vez)...');
  if (spawnSync('npm', ['install'], { cwd: join(root, 'frontend'), stdio: 'inherit', shell: windows }).status !== 0)
  {
    fail('npm install falhou.');
  }
}

if (useProductionApi)
{
  console.log(`[dev] Usando a API de produção: ${productionApi}`);
  start('web', 'npm', ['run', 'dev'], join(root, 'frontend'), { VITE_API_URL: productionApi });
}
else if (await portOpen(8080))
{
  console.log('[dev] Já tem algo rodando na porta 8080; usando esse backend.');
  start('web', 'npm', ['run', 'dev'], join(root, 'frontend'));
}
else
{
  console.log('[dev] Subindo o backend em http://localhost:8080 ...');
  const backend = start('api', process.execPath, ['--watch', 'src/server.js'], join(root, 'backend'));
  await waitForPort(8080, backend, 30);
  console.log('[dev] Backend pronto. Subindo o frontend...');
  start('web', 'npm', ['run', 'dev'], join(root, 'frontend'));
}

console.log('[dev] Abra http://localhost:5173 · Ctrl+C para parar tudo.');
