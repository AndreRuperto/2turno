// Sobe backend (8080) e frontend (5173) juntos; Ctrl+C derruba os dois.
// Uso, na raiz do repositório:
//   npm run dev               backend local + frontend
//   npm run dev -- --prod-api só o frontend, usando a API de produção
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
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



function javaMajorVersion()
{
  const java = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', 'java') : 'java';
  const result = spawnSync(java, ['-version'], { encoding: 'utf8' });
  const match = `${result.stderr}${result.stdout}`.match(/version "(?:1\.)?(\d+)/);
  return match ? Number(match[1]) : null;
}



// Prefere o Maven local em .tools/ (fora do git); senão usa o do PATH.
function mavenCommand()
{
  const tools = join(root, '.tools');
  const local = existsSync(tools) && readdirSync(tools).find(name => /^apache-maven-[\d.]+$/.test(name));
  if (local) return join(tools, local, 'bin', windows ? 'mvn.cmd' : 'mvn');
  if (spawnSync('mvn', ['-v'], { shell: windows }).status === 0) return 'mvn';
  return null;
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
    // mvn e npm abrem subprocessos (java, vite); no Windows só o taskkill /T derruba a árvore.
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
  const java = javaMajorVersion();
  if (!java || java < 21)
  {
    fail(`O backend precisa do Java 21 (encontrado: ${java ?? 'nenhum'}).\n`
      + '      Windows: winget install EclipseAdoptium.Temurin.21.JDK, depois reabra o terminal.\n'
      + '      Ou rode só o frontend com a API de produção: npm run dev -- --prod-api');
  }
  const maven = mavenCommand();
  if (!maven) fail('Maven não encontrado. Instale o Maven ou coloque-o em .tools/apache-maven-<versão>.');
  console.log('[dev] Subindo o backend em http://localhost:8080 ...');
  const backend = start('api', maven, ['-q', 'spring-boot:run'], join(root, 'backend'));
  await waitForPort(8080, backend, 180);
  console.log('[dev] Backend pronto. Subindo o frontend...');
  start('web', 'npm', ['run', 'dev'], join(root, 'frontend'));
}

console.log('[dev] Abra http://localhost:5173 · Ctrl+C para parar tudo.');
