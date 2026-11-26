// 안드로이드 보정 측정. 에뮬레이터(adb)의 크롬이나 WebView 셸 앱에서 같은 화면을 여러 번 열고 사용자 기준 순간을 잰다.
// PR마다 도는 판정(measure.mjs, 데스크탑 Chromium에 CPU 4배 제한)이 실제 앱 웹뷰와 얼마나 다른지 보려는 것이다.
// 사용(.github/workflows/android-webview-calibration.yml 이 부른다):
//   node .claude/skills/verify-jachwi/scripts/measure-android.mjs --target chrome|webview --base http://localhost:4302 \
//     --runs 5 --net fast4g --out <폴더>
// 시나리오(SCENARIOS). 크롬은 cold 만, 웹뷰는 셋 다 회차마다 cold, warm, register 순서로 돈다.
// - cold: 빈 캐시 첫 방문(/?view=list). 첫 목록 카드가 보이기까지와, 목록 요청(GET /api/properties)의 시작과 응답 도착 시각.
// - warm: cold 바로 뒤 앱만 껐다 켜서 같은 캐시로 다시 방문. 같은 순간과, 네트워크로 받은 바이트(캐시에서 온 것은 0).
// - register: 앱 데이터를 지운 홈(지도 보기)에서 "현재 위치로 이동", 등록 제안의 "추가"를 실제로 누르고, 목 저장 응답(POST
//   /api/properties)을 받고, 새 방 번호의 항목(a[href="/properties/<번호>"])이 화면에 보이기까지. 회차가 끝나면 만든 방을 목 API로
//   지워(DELETE) 목 상태를 처음으로 되돌리고, 다음 회차 전에 목록 수가 처음과 같은지 확인한다.
// - 기기에서 localhost:<포트> 는 adb reverse 로 러너의 serve.mjs 에, 지도 SDK 주소(oapi.map.naver.com)는 명령줄 플래그
//   (host-resolver-rules)로 기기의 127.0.0.1:<map-sdk-port> 에, 그것도 adb reverse 로 map-sdk-stub.mjs 에 간다. 지도는 뜨지 않는다.
// - chrome: 회차마다 앱 데이터를 지우고(pm clear) Playwright _android.launchBrowser 로 붙는다.
// - webview: android/webview-shell 의 셸 앱(mobile/App.tsx 와 같은 WebView 설정)을 띄우고 웹뷰 디버깅으로 붙는다.
//   RN 앱이 문서 시작 때 넣는 네이티브 맥락 스크립트(mobile/src/webBridge.ts)도 같이 넣는다.
// - CPU 제한은 걸지 않는다(기기 CPU 그대로). 회선은 --net 의 회선 값만 CDP로 건다.
// 결과: <out>/runs.jsonl(회차별 원자료), <out>/result.json(시나리오별 요약), <out>/device.json(기기와 웹뷰 버전),
//       <out>/<시나리오>-last.png(마지막 회차 화면), 실패한 회차는 <out>/<시나리오>-<회차>-fail.png
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { createNativeContextScript } from '../../../../mobile/src/webBridge.ts';
import { MAP_MARKS, NETWORKS, watchMoment } from './moment-watch.mjs';
import { findScreen } from './screens.mjs';
import { median } from './verdict.mjs';

// 시나리오를 바꾸면 version 을 올린다. 이력 비교(calibration-history.mjs)는 version 이 다른 기록을 "조건 바뀜"으로 본다.
export const SCENARIOS = {
  cold: { version: 1, label: '빈 캐시 첫 방문: 첫 목록 카드', metric: 'moment' },
  warm: { version: 1, label: '같은 캐시로 재방문: 첫 목록 카드', metric: 'moment' },
  register: { version: 1, label: '방 등록: "추가"를 누르고 새 방 항목이 보이기까지', metric: 'total' },
};

const { values: args } = parseArgs({
  options: {
    target: { type: 'string' },
    base: { type: 'string', default: 'http://localhost:4302' },
    screen: { type: 'string', default: 'home' },
    // 휴대폰 폭 홈은 기본이 지도 보기라 목록 카드를 재려면 목록 보기로 연다.
    path: { type: 'string', default: '/?view=list' },
    runs: { type: 'string', default: '5' },
    warmup: { type: 'string', default: '1' },
    net: { type: 'string', default: 'fast4g' },
    timeout: { type: 'string', default: '45' },
    out: { type: 'string' },
    pkg: { type: 'string', default: 'kr.jachwisunbae.webviewshell' },
    'map-sdk-port': { type: 'string', default: '4443' },
    latitude: { type: 'string', default: '37.5563' },
    longitude: { type: 'string', default: '126.9236' },
  },
});
if (!['chrome', 'webview'].includes(args.target ?? '')) throw new Error('--target 은 chrome 이나 webview 다');
if (!args.out) throw new Error('--out 이 필요하다');

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const require = createRequire(join(repoRoot, 'qa/package.json'));
const playwright = await import(pathToFileURL(require.resolve('playwright-core')).href);
const { _android } = playwright.default ?? playwright;

const screen = findScreen(args.screen);
if (!screen?.moment) throw new Error(`순간이 정해지지 않은 화면: ${args.screen}`);
const condition = NETWORKS[args.net];
if (!condition) throw new Error(`모르는 회선: ${args.net}`);
const listUrl = new URL(args.path, args.base).href;
const homeUrl = new URL('/', args.base).href;
const apiUrl = new URL('/api/properties', args.base).href;
const timeoutMs = Number(args.timeout) * 1000;
const geolocation = { latitude: Number(args.latitude), longitude: Number(args.longitude), accuracy: 10 };
const out = resolve(args.out);
mkdirSync(out, { recursive: true });
const runsFile = join(out, 'runs.jsonl');
writeFileSync(runsFile, '');

// 명령줄 파일은 디버그 가능한 이미지(google_apis)에서만 읽힌다. 크롬은 Playwright 가 chrome-command-line 에 쓴다.
const flags = [`--host-resolver-rules="MAP oapi.map.naver.com 127.0.0.1:${args['map-sdk-port']}"`, '--ignore-certificate-errors'];
const appVersion = JSON.parse(readFileSync(join(repoRoot, 'mobile/package.json'), 'utf8')).version;
// mobile/App.tsx 와 같은 값. 로그인 제공자는 키가 있어야 켜지므로 셸에서는 뺀다.
const nativeContext = createNativeContextScript('android', ['push'], { appVersion, appBuild: null });

// 브라우저 안에서 돈다. 목 저장 응답에서 새 방 번호를 읽고, 그 번호의 항목이 화면에 보인 시각과 마지막 클릭 시각을 남긴다.
const watchCreated = () => {
  const c = { clickAt: null, saveStart: null, saveHeadersAt: null, createdId: null, visibleAt: null };
  window.__calib = c;
  document.addEventListener('click', () => (c.clickAt = performance.now()), true);
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const isSave = method === 'POST' && new URL(url, location.href).pathname === '/api/properties';
    if (isSave) c.saveStart = performance.now();
    const response = await originalFetch(input, init);
    if (isSave) {
      c.saveHeadersAt = performance.now();
      response
        .clone()
        .json()
        .then((body) => (c.createdId = body?.data?.id ?? null))
        .catch(() => {});
    }
    return response;
  };
  const inView = (element) => {
    const r = element.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  };
  const check = () => {
    if (c.createdId === null || c.visibleAt !== null) return;
    const element = document.querySelector(`a[href="/properties/${c.createdId}"]`);
    if (!element || !inView(element)) return;
    c.visibleAt = -1;
    requestAnimationFrame(() => requestAnimationFrame(() => (c.visibleAt = performance.now())));
  };
  new MutationObserver(check).observe(document, { childList: true, subtree: true, attributes: true });
  setInterval(check, 50);
};

const [device] = await _android.devices();
if (!device) throw new Error('adb 기기가 없다');
const sh = async (command) => (await device.shell(command)).toString().trim();
const writeDeviceFile = (path, text) => sh(`echo ${Buffer.from(text).toString('base64')} | base64 -d > ${path}`);
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

const deviceInfo = {
  release: await sh('getprop ro.build.version.release'),
  sdk: await sh('getprop ro.build.version.sdk'),
  model: await sh('getprop ro.product.model'),
  abi: await sh('getprop ro.product.cpu.abi'),
  fingerprint: await sh('getprop ro.build.fingerprint'),
  webview: (await sh('dumpsys webviewupdate')).match(/Current WebView package \(name, version\): \(([^)]*)\)/)?.[1] ?? null,
  chrome: (await sh('dumpsys package com.android.chrome')).match(/versionName=(\S+)/)?.[1] ?? null,
};
writeFileSync(join(out, 'device.json'), `${JSON.stringify(deviceInfo, null, 2)}\n`);

const waitWebViewGone = async () => {
  for (let i = 0; i < 50 && device.webViews().some((view) => view.pkg() === args.pkg); i += 1) await sleep(200);
};

// 앱(크롬이나 셸)을 띄워 빈 페이지에 붙는다. clear 면 앱 데이터(캐시, 저장소, 쿠키)를 지운다.
const launch = async ({ clear }) => {
  if (args.target === 'chrome') {
    await sh('pm clear com.android.chrome');
    await sh('pm grant com.android.chrome android.permission.POST_NOTIFICATIONS').catch(() => {});
    const context = await device.launchBrowser({ args: flags, ignoreHTTPSErrors: true });
    const page = context.pages()[0] ?? (await context.newPage());
    return { context, page, close: () => context.close().catch(() => {}) };
  }
  await sh(`am force-stop ${args.pkg}`);
  await waitWebViewGone();
  if (clear) await sh(`pm clear ${args.pkg}`);
  for (const permission of ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'])
    await sh(`pm grant ${args.pkg} android.permission.${permission}`).catch(() => {});
  await writeDeviceFile('/data/local/tmp/webview-command-line', `_ ${flags.join(' ')}\n`);
  await sh(`am start -W -n ${args.pkg}/.MainActivity --es appVersion ${appVersion}`);
  const webView = await device.webView({ pkg: args.pkg }, { timeout: 30_000 });
  const page = await webView.page();
  await page.addInitScript(nativeContext);
  return {
    context: page.context(),
    page,
    close: async () => {
      await sh(`am force-stop ${args.pkg}`);
      await waitWebViewGone();
    },
  };
};

// 붙은 페이지에 순간 감시, 회선 제한, 바이트 세기를 건다.
const instrument = async ({ context, page }) => {
  await page.addInitScript(watchMoment, {
    selector: screen.moment.selector,
    text: screen.moment.text,
    mapTiming: false,
    marks: MAP_MARKS,
  });
  await page.addInitScript(watchCreated);
  const failedRequests = [];
  page.on('requestfailed', (request) =>
    failedRequests.push(`${request.failure()?.errorText} ${request.url().slice(0, 120)}`),
  );
  page.on(
    'response',
    (response) =>
      response.status() >= 400 && failedRequests.push(`${response.status()} ${response.url().slice(0, 120)}`),
  );
  const cdp = await context.newCDPSession(page);
  const net = { bytes: 0, requests: 0, cached: 0 };
  cdp.on('Network.requestWillBeSent', () => (net.requests += 1));
  cdp.on('Network.requestServedFromCache', () => (net.cached += 1));
  cdp.on('Network.responseReceived', ({ response }) => {
    if (response.fromDiskCache || response.fromPrefetchCache || response.fromServiceWorker) net.cached += 1;
  });
  cdp.on('Network.loadingFinished', ({ encodedDataLength }) => (net.bytes += encodedDataLength));
  await cdp.send('Network.enable');
  await cdp.send('Security.setIgnoreCertificateErrors', { ignore: true }).catch(() => {});
  if (condition.net) await cdp.send('Network.emulateNetworkConditions', condition.net);
  return { cdp, net, failedRequests };
};

const poll = async (page, read, done) => {
  const deadline = Date.now() + timeoutMs;
  let value = null;
  while (Date.now() < deadline) {
    value = await page.evaluate(read).catch(() => null);
    if (done(value)) return value;
    await page.waitForTimeout(100);
  }
  return value;
};

const listTiming = (page) =>
  page
    .evaluate((url) => {
      const entry = performance.getEntriesByName(url).find((item) => item.initiatorType === 'fetch');
      return entry ? { listStart: entry.startTime, listResponseEnd: entry.responseEnd } : null;
    }, apiUrl)
    .catch(() => null);

const round = (value) => (typeof value === 'number' && value > 0 ? Math.round(value) : null);

// cold, warm: 목록 보기를 열고 첫 목록 카드가 보이기까지.
const visitList = async ({ clear, screenshot }) => {
  const app = await launch({ clear });
  const { net, failedRequests } = await instrument(app);
  app.page.goto(listUrl, { waitUntil: 'commit' }).catch(() => {});
  const seen = await poll(
    app.page,
    () => window.__verify,
    (value) => value?.at > 0,
  );
  await app.page.waitForTimeout(1000);
  const timing = await listTiming(app.page);
  const userAgent = await app.page.evaluate(() => navigator.userAgent).catch(() => null);
  if (screenshot) await app.page.screenshot({ path: screenshot }).catch(() => {});
  await app.close();
  const moment = seen?.at > 0 ? Math.round(seen.at) : null;
  return {
    ok: moment !== null,
    moment,
    phases: { listStart: round(timing?.listStart), listResponseEnd: round(timing?.listResponseEnd), cardVisible: moment },
    lcp: round(seen?.lcp),
    bytes: net.bytes,
    requests: net.requests,
    cached: net.cached,
    userAgent,
    failedRequests,
  };
};

const mockList = async () => {
  const response = await fetch(apiUrl);
  const body = await response.json();
  return body.data.items.map((item) => item.id);
};
const baselineIds = await mockList();

// 목 상태를 처음으로 되돌린다. 처음에 없던 방은 지운다.
const resetMock = async () => {
  for (const id of await mockList()) {
    if (!baselineIds.includes(id)) await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
  }
  const now = await mockList();
  if (now.length !== baselineIds.length) throw new Error(`목 상태를 되돌리지 못했다: ${now.length}/${baselineIds.length}`);
};

// register: 홈(지도 보기)에서 현재 위치로 옮기고 등록 제안의 "추가"를 눌러 방을 만든다.
const registerRoom = async ({ screenshot, failShot }) => {
  await resetMock();
  const app = await launch({ clear: true });
  const { cdp, net, failedRequests } = await instrument(app);
  await cdp.send('Emulation.setGeolocationOverride', geolocation).catch(() => {});
  let error = null;
  let created = null;
  try {
    await app.page.goto(homeUrl, { waitUntil: 'commit' });
    // 목록이 와야 등록 뒤 화면이 안정적이다. 기록한 동네 칩(매물 수)이 보이면 목록이 온 것이다.
    await app.page.locator('nav[aria-label="기록한 동네"] button span').first().waitFor({ timeout: timeoutMs });
    await app.page.getByRole('button', { name: '현재 위치로 이동' }).first().click({ timeout: timeoutMs });
    await app.page.getByRole('button', { name: '추가', exact: true }).click({ timeout: 15_000 });
    created = await poll(
      app.page,
      () => window.__calib,
      (value) => value?.visibleAt > 0,
    );
    if (!(created?.visibleAt > 0)) error = `새 방 항목을 못 봤다(createdId ${created?.createdId ?? '-'})`;
  } catch (caught) {
    error = String(caught).split('\n')[0].slice(0, 200);
  }
  if (error && failShot) await app.page.screenshot({ path: failShot }).catch(() => {});
  if (!error && screenshot) await app.page.screenshot({ path: screenshot }).catch(() => {});
  const saveEntry = created?.saveStart
    ? await app.page
        .evaluate(
          ({ url, start }) =>
            performance
              .getEntriesByName(url)
              .find((item) => item.initiatorType === 'fetch' && Math.abs(item.startTime - start) < 50)?.responseEnd ??
            null,
          { url: apiUrl, start: created.saveStart },
        )
        .catch(() => null)
    : null;
  await app.close();
  const since = (value) => (created?.clickAt && value > 0 ? Math.round(value - created.clickAt) : null);
  const total = error ? null : since(created?.visibleAt);
  return {
    ok: total !== null,
    total,
    createdId: created?.createdId ?? null,
    phases: {
      saveStart: since(created?.saveStart),
      saveResponse: since(saveEntry ?? created?.saveHeadersAt),
      itemVisible: total,
    },
    bytes: net.bytes,
    requests: net.requests,
    error,
    failedRequests,
  };
};

const scenarioNames = args.target === 'chrome' ? ['cold'] : ['cold', 'warm', 'register'];
const runs = Number(args.runs);
const rows = [];
const record = (row) => {
  rows.push(row);
  appendFileSync(runsFile, `${JSON.stringify(row)}\n`);
  const value = row[SCENARIOS[row.scenario].metric];
  console.log(args.target, row.scenario, row.run, value ?? `실패 ${row.error ?? ''}`, 'bytes', row.bytes);
};

for (let run = 1 - Number(args.warmup); run <= runs; run += 1) {
  const warm = run <= 0;
  const last = run === runs;
  const shot = (name) => (last ? join(out, `${name}-last.png`) : undefined);
  const failShot = (name) => (warm ? undefined : join(out, `${name}-${run}-fail.png`));
  for (const scenario of scenarioNames) {
    let measured;
    try {
      if (scenario === 'cold') measured = await visitList({ clear: true, screenshot: shot('cold') });
      if (scenario === 'warm') measured = await visitList({ clear: false, screenshot: shot('warm') });
      if (scenario === 'register')
        measured = await registerRoom({ screenshot: shot('register'), failShot: failShot('register') });
    } catch (caught) {
      measured = { ok: false, error: String(caught).split('\n')[0].slice(0, 200) };
    }
    if (!warm) record({ target: args.target, scenario, run, ...measured });
  }
}
await resetMock().catch((caught) => console.error(`::warning::${caught}`));
await device.close();

const stats = (values) => {
  const numbers = values.filter((value) => typeof value === 'number');
  return numbers.length === 0
    ? { n: 0, median: null, min: null, max: null }
    : { n: numbers.length, median: median(numbers), min: Math.min(...numbers), max: Math.max(...numbers) };
};
const scenarios = Object.fromEntries(
  scenarioNames.map((scenario) => {
    const ofScenario = rows.filter((row) => row.scenario === scenario);
    const phaseNames = [...new Set(ofScenario.flatMap((row) => Object.keys(row.phases ?? {})))];
    return [
      scenario,
      {
        version: SCENARIOS[scenario].version,
        label: SCENARIOS[scenario].label,
        metric: SCENARIOS[scenario].metric,
        runs: ofScenario.length,
        success: ofScenario.filter((row) => row.ok).length,
        ...stats(ofScenario.filter((row) => row.ok).map((row) => row[SCENARIOS[scenario].metric])),
        phases: Object.fromEntries(
          phaseNames.map((name) => [name, stats(ofScenario.filter((row) => row.ok).map((row) => row.phases?.[name]))]),
        ),
        bytes: stats(ofScenario.filter((row) => row.ok).map((row) => row.bytes)),
        errors: ofScenario.filter((row) => !row.ok).map((row) => row.error ?? '순간을 못 봄'),
      },
    ];
  }),
);
const summary = {
  target: args.target,
  screen: screen.name,
  moment: screen.moment.label,
  url: listUrl,
  net: args.net,
  cpu: 1,
  device: deviceInfo,
  userAgent: rows.find((row) => row.userAgent)?.userAgent ?? null,
  scenarios,
};
writeFileSync(join(out, 'result.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary.scenarios));
