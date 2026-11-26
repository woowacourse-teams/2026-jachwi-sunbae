// 운영 빌드(dist)를 정적으로 내보내고 /api 를 MSW 목이나 dev API로 답하는 서버다. 전후 판정과 기준 스크린샷에 쓴다.
// 사용: node .claude/skills/verify-jachwi/scripts/serve.mjs --dist <dist 폴더> --port 4301 [--api mock] (dev는 --api dev 와 VERIFY_ALLOW_DEV_API=1 이 둘 다 있어야 한다) [--delay 300]
// - mock: 이 레포 frontend/src/app/mocks/handlers 를 Node에서 그대로 돌리고, 모든 /api 응답을 --delay ms 뒤에 보낸다.
//   서비스 워커가 아니라 진짜 HTTP 응답이라 DevTools 회선 제한이 API에도 걸린다. 전과 후가 같은 목 데이터를 받는다.
// - --cache prod: 정적 파일에 운영(publish.sh)과 같은 Cache-Control 을 붙인다. 해시가 붙은 파일은 1년 immutable, 나머지(index.html 등)는
//   no-cache 와 ETag(304 재검증)다. 재방문을 재는 안드로이드 보정(measure-android.mjs)이 쓴다. 기본(none)은 캐시 헤더를 붙이지 않는다.
// - --faults: 실패 주입을 켠다(mock 전용). POST /__verify/faults 에 {"method":"POST","path":"/api/properties","status":500,"times":1}
//   을 보내면 맞는 다음 요청 times 번을 그 상태로 답한다. DELETE /__verify/faults 는 모두 지운다. 실패 초기화 시나리오가 쓴다.
// - dev: dev 서버에 익명 회원과 기록이 남는다. 옵션과 환경 변수가 둘 다 있을 때만 켜진다. /api 를 https://dev-api.jachwi-sunbae.kr 로 중계하고 Origin 헤더를 지운다(dev 서버의 프록시와 같다).
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { resolveApiMode } from './api-mode.mjs';

const { values: args } = parseArgs({
  options: {
    dist: { type: 'string' },
    port: { type: 'string', default: '4301' },
    api: { type: 'string' },
    delay: { type: 'string', default: '300' },
    cache: { type: 'string', default: 'none' },
    faults: { type: 'boolean', default: false },
  },
});
if (!args.dist) throw new Error('--dist 가 필요하다');
const apiMode = resolveApiMode(args.api);
const dist = resolve(args.dist);
const port = Number(args.port);
const delayMs = Number(args.delay);
if (!['none', 'prod'].includes(args.cache)) throw new Error(`--cache 는 none 이나 prod 다: ${args.cache}`);
const devApi = 'https://dev-api.jachwi-sunbae.kr';
const frontendDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../frontend');

const loadMockHandlers = async () => {
  const require = createRequire(join(frontendDir, 'package.json'));
  const vite = await import(pathToFileURL(require.resolve('vite')).href);
  const msw = await import(pathToFileURL(require.resolve('msw')).href);
  const { module } = await vite.runnerImport(join(frontendDir, 'src/app/mocks/handlers/index.ts'), {
    configFile: false,
    root: frontendDir,
    logLevel: 'error',
    resolve: { alias: { '@': join(frontendDir, 'src') } },
  });
  return { handlers: module.handlers, getResponse: msw.getResponse };
};

const mock = apiMode === 'mock' ? await loadMockHandlers() : undefined;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json',
};

const readBody = (req) =>
  new Promise((done) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => done(chunks.length > 0 ? Buffer.concat(chunks) : undefined));
  });

const sendFetchResponse = async (res, response) => {
  const headers = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  res.writeHead(response.status, headers);
  res.end(Buffer.from(await response.arrayBuffer()));
};

let faults = [];

const answerFaults = async (req, res) => {
  if (req.method === 'DELETE') faults = [];
  if (req.method === 'POST') {
    const body = JSON.parse((await readBody(req))?.toString() || '{}');
    faults.push({ method: String(body.method ?? 'GET').toUpperCase(), path: String(body.path), status: Number(body.status ?? 500), times: Number(body.times ?? 1) });
  }
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify(faults));
};

const takeFault = (req, url) => {
  const fault = faults.find((item) => item.times > 0 && item.method === req.method && item.path === url.pathname);
  if (!fault) return null;
  fault.times -= 1;
  return fault;
};

const answerApi = async (req, res, url) => {
  const fault = mock && args.faults ? takeFault(req, url) : null;
  if (fault) {
    if (!['GET', 'HEAD'].includes(req.method)) await readBody(req);
    await new Promise((done) => setTimeout(done, delayMs));
    res.writeHead(fault.status, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ code: 'VERIFY_FAULT', message: '실패 주입', data: null }));
    return;
  }
  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await readBody(req);
  const headers = Object.fromEntries(
    Object.entries(req.headers).filter(([key]) => !['host', 'origin', 'connection', 'content-length'].includes(key)),
  );
  if (!mock) {
    const response = await fetch(`${devApi}${url.pathname}${url.search}`, {
      method: req.method,
      headers,
      body,
      redirect: 'manual',
    });
    const forwarded = new Headers(response.headers);
    forwarded.delete('content-encoding');
    forwarded.delete('content-length');
    await sendFetchResponse(res, new Response(response.body, { status: response.status, headers: forwarded }));
    return;
  }
  const request = new Request(url, { method: req.method, headers, body });
  const [response] = await Promise.all([
    mock.getResponse(mock.handlers, request),
    new Promise((done) => setTimeout(done, delayMs)),
  ]);
  await sendFetchResponse(res, response ?? new Response('목 핸들러 없음', { status: 501 }));
};

// 운영 빌드의 해시 파일 이름(예: 143.5cc48781f402de60958b.js).
const HASHED_FILE = /\.[0-9a-f]{8,}\.[a-z0-9]+$/;

const answerStatic = (req, res, url) => {
  const file = normalize(join(dist, decodeURIComponent(url.pathname)));
  const target = file.startsWith(dist) && existsSync(file) && statSync(file).isFile() ? file : join(dist, 'index.html');
  const headers = { 'content-type': types[extname(target)] ?? 'application/octet-stream' };
  if (args.cache === 'prod') {
    const stat = statSync(target);
    const etag = `"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
    headers.etag = etag;
    headers['cache-control'] = HASHED_FILE.test(target)
      ? 'public,max-age=31536000,immutable'
      : 'no-cache,max-age=0,must-revalidate';
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, headers);
      res.end();
      return;
    }
  }
  res.writeHead(200, headers);
  createReadStream(target).pipe(res);
};

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`);
  const work =
    args.faults && url.pathname === '/__verify/faults'
      ? answerFaults(req, res)
      : url.pathname.startsWith('/api/')
        ? answerApi(req, res, url)
        : Promise.resolve(answerStatic(req, res, url));
  work.catch((error) => {
    console.error(error);
    if (!res.headersSent) res.writeHead(502);
    res.end();
  });
}).listen(port, () => console.log(`ready http://localhost:${port} dist=${dist} api=${apiMode} delay=${delayMs}ms cache=${args.cache}`));
