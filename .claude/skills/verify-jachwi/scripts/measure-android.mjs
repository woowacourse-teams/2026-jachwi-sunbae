// 안드로이드 보정 측정. 에뮬레이터(adb)의 크롬이나 WebView 셸 앱에서 같은 화면을 여러 번 열고 사용자 기준 순간을 잰다.
// PR마다 도는 판정(measure.mjs, 데스크탑 Chromium에 CPU 4배 제한)이 실제 앱 웹뷰와 얼마나 다른지 보려는 것이다.
// 사용(.github/workflows/android-webview-calibration.yml 이 부른다):
//   node .claude/skills/verify-jachwi/scripts/measure-android.mjs --target chrome|webview --base http://localhost:4302 \
//     --runs 5 --net fast4g --out <폴더> [--scenarios cold,register] [--warmup 1] [--map-sdk stub|real]
// - --map-sdk real: 지도 SDK 주소를 돌리지 않고 실제 네이버 지도 SDK 를 받는다. 실제 키로 빌드한 dist 를 네이버 콘솔에 등록된 주소
//   (localhost:3000)로 띄워야 한다. 이때는 SCENARIOS 의 mapSdk: 'real' 시나리오(real-*)만 돈다. 지도 인증이 실패하면 환경 오류로 남긴다.
// - 키가 담긴 주소(ncpKeyId 등)는 원자료와 요약에 남기기 전에 가린다(redact).
// 시나리오 정의는 android-scenarios.mjs 의 SCENARIOS 다. 크롬은 cold 만, 웹뷰는 회차마다 고른 시나리오를 차례로 돈다.
// - cold: 빈 캐시 첫 방문(/?view=list). 첫 목록 카드가 보이기까지와, 목록 요청(GET /api/properties)의 시작과 응답 도착 시각.
// - warm: cold 바로 뒤 앱만 껐다 켜서 같은 캐시로 다시 방문. 같은 순간과, 네트워크로 받은 바이트(캐시에서 온 것은 0).
// - register: 앱 데이터를 지운 홈(지도 보기)에서 "현재 위치로 이동", 등록 제안의 "추가"를 실제로 누르고, 목 저장 응답(POST
//   /api/properties)을 받고, 새 방 번호의 항목(a[href="/properties/<번호>"])이 화면에 보이기까지.
// - geo-slow: register 와 같되 페이지의 위치 응답을 GEO_DELAY_MS 늦춘다. "현재 위치로 이동"을 누른 때부터 잰다.
// - denied: 앱 위치 권한 없이(셸은 권한이 없으면 웹의 위치 요청을 거부한다) "현재 위치로 이동"을 눌러 거부 알림을 보고, 주소 검색으로
//   위치를 고른 뒤, 권한을 켜고(pm grant, 실제 사용자가 설정에서 켜는 것) 다시 등록한다. 주소로 고른 자리에 등록하려면 지도를 눌러야
//   하는데 지도 SDK 목에서는 지도가 뜨지 않아 그 마지막 단계는 재지 못한다(selectionRegister 에 남긴다).
// - fail-reset: serve.mjs --faults 로 저장 요청 한 번을 500으로 만들고, 실패 알림까지, 목 상태가 그대로인지, 다시 눌러 등록되는지 본다.
// - 목 상태: 등록하는 시나리오는 시작 전에 처음에 없던 방을 목 API로 지우고(DELETE) 목록 수가 처음과 같은지 확인한다.
// - 기기에서 localhost:<포트> 는 adb reverse 로 러너의 serve.mjs 에, 지도 SDK 주소(oapi.map.naver.com)는 명령줄 플래그
//   (host-resolver-rules)로 기기의 127.0.0.1:<map-sdk-port> 에, 그것도 adb reverse 로 map-sdk-stub.mjs 에 간다. 지도는 뜨지 않는다.
// - chrome: 회차마다 앱 데이터를 지우고(pm clear) Playwright _android.launchBrowser 로 붙는다.
// - webview: android/webview-shell 의 셸 앱(mobile/App.tsx 와 같은 WebView 설정)을 띄우고 웹뷰 디버깅으로 붙는다.
//   RN 앱이 문서 시작 때 넣는 네이티브 맥락 스크립트(mobile/src/webBridge.ts)도 같이 넣는다.
// - CPU 제한은 걸지 않는다(기기 CPU 그대로). 회선은 --net 의 회선 값만 CDP로 건다.
// - 오류 분류: 기기, 연결, 웹뷰 붙기 오류는 앞에 ENV_ERROR_PREFIX 를 붙여 환경 오류로 남긴다. 판정은 환경 오류를 뺀다.
// 결과: <out>/runs.jsonl(회차별 원자료), <out>/result.json(시나리오별 요약), <out>/device.json(기기와 웹뷰 버전),
//       <out>/<시나리오>-last.png(마지막 회차 화면), 실패한 회차는 <out>/<시나리오>-<회차>-fail.png
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { createNativeContextScript } from '../../../../mobile/src/webBridge.ts';
import { ENV_ERROR_PREFIX, GEO_DELAY_MS, isEnvironmentError, SCENARIOS, scenariosFor } from './android-scenarios.mjs';
import { MAP_MARKS, NETWORKS, watchMoment } from './moment-watch.mjs';
import { findScreen } from './screens.mjs';
import { median } from './verdict.mjs';

const { values: args } = parseArgs({
  options: {
    target: { type: 'string' },
    base: { type: 'string', default: 'http://localhost:4302' },
    screen: { type: 'string', default: 'home' },
    // 휴대폰 폭 홈은 기본이 지도 보기라 목록 카드를 재려면 목록 보기로 연다.
    path: { type: 'string', default: '/?view=list' },
    scenarios: { type: 'string' },
    runs: { type: 'string', default: '5' },
    warmup: { type: 'string', default: '1' },
    net: { type: 'string', default: 'fast4g' },
    timeout: { type: 'string', default: '45' },
    out: { type: 'string' },
    pkg: { type: 'string', default: 'kr.jachwisunbae.webviewshell' },
    'map-sdk-port': { type: 'string', default: '4443' },
    'map-sdk': { type: 'string', default: 'stub' },
    latitude: { type: 'string', default: '37.5563' },
    longitude: { type: 'string', default: '126.9236' },
  },
});
if (!['chrome', 'webview'].includes(args.target ?? '')) throw new Error('--target 은 chrome 이나 webview 다');
if (!args.out) throw new Error('--out 이 필요하다');
if (!['stub', 'real'].includes(args['map-sdk'])) throw new Error('--map-sdk 는 stub 이나 real 이다');
const realMap = args['map-sdk'] === 'real';
const allowed = scenariosFor(args['map-sdk']);
const scenarioNames =
  args.target === 'chrome'
    ? ['cold']
    : (args.scenarios ?? allowed.join(',')).split(',').filter((name) => allowed.includes(name));
// warm 은 같은 회차의 cold 가 채운 캐시를 쓴다.
if (scenarioNames.includes('warm') && !scenarioNames.includes('cold')) scenarioNames.unshift('cold');

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
const faultsUrl = new URL('/__verify/faults', args.base).href;
const timeoutMs = Number(args.timeout) * 1000;
const geolocation = { latitude: Number(args.latitude), longitude: Number(args.longitude), accuracy: 10 };
const out = resolve(args.out);
mkdirSync(out, { recursive: true });
const runsFile = join(out, 'runs.jsonl');
writeFileSync(runsFile, '');

// 명령줄 파일은 디버그 가능한 이미지(google_apis)에서만 읽힌다. 크롬은 Playwright 가 chrome-command-line 에 쓴다.
const flags = realMap
  ? []
  : [`--host-resolver-rules="MAP oapi.map.naver.com 127.0.0.1:${args['map-sdk-port']}"`, '--ignore-certificate-errors'];
// 원자료와 요약에 키가 남지 않게 가린다. 지도 SDK 주소의 ncpKeyId 와, 환경 변수로 받은 키 값 그대로를 지운다.
const SECRET_VALUES = [process.env.NAVER_MAP_CLIENT_ID].filter((value) => typeof value === 'string' && value.length >= 4);
export const redact = (text) =>
  SECRET_VALUES.reduce(
    (acc, value) => acc.split(value).join('***'),
    String(text).replace(/((?:ncpKeyId|ncpClientId|clientId)=)[^&\s"']+/gi, '$1***'),
  );
const appVersion = JSON.parse(readFileSync(join(repoRoot, 'mobile/package.json'), 'utf8')).version;
// mobile/App.tsx 와 같은 값. 로그인 제공자는 키가 있어야 켜지므로 셸에서는 뺀다.
const nativeContext = createNativeContextScript('android', ['push'], { appVersion, appBuild: null });

class EnvironmentError extends Error {}
const asEnvironment = async (work) => {
  try {
    return await work();
  } catch (error) {
    throw new EnvironmentError(`${ENV_ERROR_PREFIX}${String(error).split('\n')[0].slice(0, 180)}`);
  }
};
const describeError = (error) => {
  const text = redact(String(error?.message ?? error).split('\n')[0].slice(0, 220));
  if (text.startsWith(ENV_ERROR_PREFIX)) return text;
  return error instanceof EnvironmentError || isEnvironmentError(text) ? `${ENV_ERROR_PREFIX}${text}` : text;
};

// 브라우저 안에서 돈다. 클릭 시각, 목 저장 요청과 응답, 새 방 번호의 항목이 보인 시각, 기다리는 글자가 보인 시각을 남긴다.
const watchCreated = () => {
  const c = { clicks: [], saveStart: null, saveHeadersAt: null, createdId: null, visibleAt: null, texts: {} };
  window.__calib = c;
  document.addEventListener('click', () => c.clicks.push(performance.now()), true);
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
        .then((body) => {
          if (body?.data?.id) c.createdId = body.data.id;
        })
        .catch(() => {});
    }
    return response;
  };
  const inView = (element) => {
    const r = element.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  };
  const check = () => {
    for (const [text, at] of Object.entries(c.texts)) {
      if (at === null && document.body?.textContent?.includes(text)) c.texts[text] = performance.now();
    }
    if (c.createdId === null || c.visibleAt !== null) return;
    const element = document.querySelector(`a[href="/properties/${c.createdId}"]`);
    if (!element || !inView(element)) return;
    c.visibleAt = -1;
    requestAnimationFrame(() => requestAnimationFrame(() => (c.visibleAt = performance.now())));
  };
  new MutationObserver(check).observe(document, { childList: true, subtree: true, attributes: true, characterData: true });
  setInterval(check, 50);
};

// 브라우저 안에서 돈다. 위치 응답을 늦춘다(위치 응답 지연 시나리오).
const delayGeolocation = (delayMs) => {
  const geo = navigator.geolocation;
  const getCurrentPosition = geo.getCurrentPosition.bind(geo);
  geo.getCurrentPosition = (success, error, options) =>
    setTimeout(() => getCurrentPosition(success, error, options), delayMs);
};

const [device] = await _android.devices();
if (!device) throw new Error(`${ENV_ERROR_PREFIX}adb 기기가 없다`);
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
const LOCATION_PERMISSIONS = ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'];
const setLocationPermission = async (granted) => {
  for (const permission of LOCATION_PERMISSIONS)
    await sh(`pm ${granted ? 'grant' : 'revoke'} ${args.pkg} android.permission.${permission}`).catch(() => {});
};

// 앱(크롬이나 셸)을 띄워 빈 페이지에 붙는다. clear 면 앱 데이터(캐시, 저장소, 쿠키, 권한)를 지운다.
const launch = ({ clear, location = true }) =>
  asEnvironment(async () => {
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
    await setLocationPermission(location);
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
  });

// 붙은 페이지에 순간 감시, 회선 제한, 바이트 세기를 건다.
const instrument = async ({ context, page }, { geoDelay = 0, mapTiming = false } = {}) => {
  await page.addInitScript(watchMoment, {
    selector: screen.moment.selector,
    text: screen.moment.text,
    mapTiming,
    marks: MAP_MARKS,
  });
  await page.addInitScript(watchCreated);
  if (geoDelay > 0) await page.addInitScript(delayGeolocation, geoDelay);
  const failedRequests = [];
  page.on('requestfailed', (request) =>
    failedRequests.push(redact(`${request.failure()?.errorText} ${request.url().slice(0, 160)}`)),
  );
  page.on(
    'response',
    (response) =>
      response.status() >= 400 && failedRequests.push(redact(`${response.status()} ${response.url().slice(0, 160)}`)),
  );
  const cdp = await asEnvironment(() => context.newCDPSession(page));
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
  await cdp.send('Emulation.setGeolocationOverride', geolocation).catch(() => {});
  return { cdp, net, failedRequests };
};

const poll = async (page, read, done, limit = timeoutMs) => {
  const deadline = Date.now() + limit;
  let value = null;
  while (Date.now() < deadline) {
    value = await page.evaluate(read).catch(() => null);
    if (done(value)) return value;
    await page.waitForTimeout(100);
  }
  return value;
};
const calib = (page) => page.evaluate(() => window.__calib).catch(() => null);
const watchText = (page, text) =>
  page.evaluate((value) => {
    window.__calib.texts[value] = null;
  }, text);
const waitText = async (page, text) => {
  const state = await poll(
    page,
    () => window.__calib,
    (value) => value?.texts?.[text] > 0,
  );
  if (!(state?.texts?.[text] > 0)) throw new Error(`"${text}"를 못 봤다`);
  return state.texts[text];
};
// 클릭하고 그 클릭이 페이지에 닿은 시각(performance.now)을 돌려준다.
const clickAt = async (page, locator) => {
  const before = (await calib(page))?.clicks?.length ?? 0;
  await locator.click({ timeout: timeoutMs });
  const state = await poll(
    page,
    () => window.__calib,
    (value) => (value?.clicks?.length ?? 0) > before,
    5000,
  );
  return state?.clicks?.[before] ?? null;
};
const waitCreatedVisible = async (page) => {
  const state = await poll(
    page,
    () => window.__calib,
    (value) => value?.visibleAt > 0,
  );
  if (!(state?.visibleAt > 0)) throw new Error(`새 방 항목을 못 봤다(createdId ${state?.createdId ?? '-'})`);
  return state;
};

const listTiming = (page) =>
  page
    .evaluate((url) => {
      const entry = performance.getEntriesByName(url).find((item) => item.initiatorType === 'fetch');
      return entry ? { listStart: entry.startTime, listResponseEnd: entry.responseEnd } : null;
    }, apiUrl)
    .catch(() => null);
const saveResponseEnd = (page, start) =>
  start
    ? page
        .evaluate(
          ({ url, at }) =>
            performance
              .getEntriesByName(url)
              .find((item) => item.initiatorType === 'fetch' && Math.abs(item.startTime - at) < 50)?.responseEnd ??
            null,
          { url: apiUrl, at: start },
        )
        .catch(() => null)
    : null;

const round = (value) => (typeof value === 'number' && value > 0 ? Math.round(value) : null);
const span = (from, to) => (typeof from === 'number' && typeof to === 'number' && to > 0 ? Math.round(to - from) : null);

// cold, warm: 목록 보기를 열고 첫 목록 카드가 보이기까지.
const visitList = async ({ clear, screenshot }) => {
  const app = await launch({ clear });
  try {
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
    const moment = seen?.at > 0 ? Math.round(seen.at) : null;
    return {
      ok: moment !== null,
      moment,
      phases: {
        listStart: round(timing?.listStart),
        listResponseEnd: round(timing?.listResponseEnd),
        cardVisible: moment,
      },
      lcp: round(seen?.lcp),
      bytes: net.bytes,
      requests: net.requests,
      cached: net.cached,
      userAgent,
      error: moment === null ? '첫 목록 카드를 못 봤다' : null,
      failedRequests,
    };
  } finally {
    await app.close();
  }
};

const mockList = () =>
  asEnvironment(async () => {
    const response = await fetch(apiUrl);
    const body = await response.json();
    return body.data.items.map((item) => item.id);
  });
const baselineIds = await mockList();

// 목 상태를 처음으로 되돌린다. 처음에 없던 방은 지우고 주입한 실패도 지운다.
const resetMock = async () => {
  for (const id of await mockList()) {
    if (!baselineIds.includes(id)) await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
  }
  await fetch(faultsUrl, { method: 'DELETE' }).catch(() => {});
  const now = await mockList();
  if (now.length !== baselineIds.length)
    throw new Error(`${ENV_ERROR_PREFIX}목 상태를 되돌리지 못했다: ${now.length}/${baselineIds.length}`);
};

// 등록 시나리오의 공통 뼈대. 홈(지도 보기)을 열고 목록이 온 뒤 flow 를 돈다.
const registerFlow = async (scenario, { location = true, geoDelay = 0, mapTiming = false, screenshot, failShot }, flow) => {
  await resetMock();
  const app = await launch({ clear: true, location });
  try {
    const { cdp, net, failedRequests } = await instrument(app, { geoDelay, mapTiming });
    let measured;
    try {
      await app.page.goto(homeUrl, { waitUntil: 'commit' });
      // 목록이 와야 등록 뒤 화면이 안정적이다. 기록한 동네 칩(매물 수)이 보이면 목록이 온 것이다.
      await app.page.locator('nav[aria-label="기록한 동네"] button span').first().waitFor({ timeout: timeoutMs });
      measured = await flow(app.page, cdp);
      if (screenshot) await app.page.screenshot({ path: screenshot }).catch(() => {});
    } catch (error) {
      if (failShot) await app.page.screenshot({ path: failShot }).catch(() => {});
      measured = { ok: false, error: describeError(error) };
    }
    return { ...measured, bytes: net.bytes, requests: net.requests, failedRequests };
  } finally {
    await app.close();
  }
};

const locateButton = (page) => page.getByRole('button', { name: '현재 위치로 이동' }).first();
const acceptButton = (page) => page.getByRole('button', { name: '추가', exact: true });
const SUGGESTION_TEXT = '현재 위치에서 매물을 추가할까요?';
const DENIED_TEXT = '위치 권한이 꺼져 있어요';
const SAVE_FAILED_TEXT = '매물을 만들지 못했어요';

// "추가"를 누르고 새 방 항목이 보이기까지. 시각은 "추가"를 누른 때부터다.
const acceptAndWait = async (page) => {
  const accepted = await clickAt(page, acceptButton(page));
  const state = await waitCreatedVisible(page);
  return {
    accepted,
    state,
    saveStart: span(accepted, state.saveStart),
    saveResponse: span(accepted, (await saveResponseEnd(page, state.saveStart)) ?? state.saveHeadersAt),
    itemVisible: span(accepted, state.visibleAt),
  };
};

const MAP_FAILED_TEXT = '지도를 연결할 수 없어요';
const mapFailed = (page) =>
  page.evaluate((text) => document.body?.textContent?.includes(text) ?? false, MAP_FAILED_TEXT).catch(() => false);
const mark = (page, name) =>
  page.evaluate((value) => performance.getEntriesByName(value).at(-1)?.startTime ?? null, name).catch(() => null);
const waitMark = async (page, name) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const at = await mark(page, name);
    if (at !== null) return at;
    if (await mapFailed(page)) throw new Error(`${ENV_ERROR_PREFIX}지도 인증 실패나 SDK 받기 실패(원자료 failedRequests 에 ERR_NAME_NOT_RESOLVED 가 있으면 기기 DNS, 없으면 네이버 콘솔의 Web 서비스 URL 확인)`);
    await page.waitForTimeout(100);
  }
  throw new Error(`${name} 표시를 못 봤다`);
};

const SCENARIO_RUNNERS = {
  'real-map-overlay': (shots) =>
    registerFlow('real-map-overlay', { ...shots, mapTiming: true }, async (page) => {
      const overlay = await waitMark(page, 'jachwi:map-overlay-attached');
      return {
        ok: true,
        overlay: Math.round(overlay),
        phases: {
          sdkReady: round(await mark(page, 'jachwi:map-sdk-ready')),
          mapCreated: round(await mark(page, 'jachwi:map-created')),
          overlay: Math.round(overlay),
        },
      };
    }),
  'real-denied-pick': (shots) =>
    registerFlow('real-denied-pick', { ...shots, location: false }, async (page, cdp) => {
      await watchText(page, DENIED_TEXT);
      const located = await clickAt(page, locateButton(page));
      const deniedAt = await waitText(page, DENIED_TEXT);
      const searchStart = await clickAt(page, page.locator('a[href="/search"]').first());
      await page.getByPlaceholder('주소로 지도 이동').fill('망원동');
      await page.locator('button', { hasText: '세종대로' }).first().click({ timeout: timeoutMs });
      await page.waitForURL(/view=map/, { timeout: timeoutMs });
      const picked = await page.evaluate(() => performance.now());
      // 고른 주소로 옮긴 지도가 그려지기를 기다린 뒤, 처음 쓰는 사람용 안내가 있으면 닫고, 검색 핀 왼쪽 아래(가운데의 핀,
      // 안내, 거리 메모 말풍선을 피한 자리)를 눌러 좌표 메뉴를 연다. 웹뷰에는 Playwright touchscreen 이 없어 CDP 터치 이벤트를 쓴다.
      await waitMark(page, 'jachwi:map-created');
      await page.waitForTimeout(1200);
      const coach = page.getByRole('button', { name: '확인', exact: true });
      if (await coach.isVisible().catch(() => false)) await coach.click().catch(() => {});
      const box = await page.locator('section[aria-label="본 방 기록 지도"]').boundingBox();
      if (!box) throw new Error('지도 영역을 못 찾았다');
      const x = Math.round(box.x + box.width / 2 - 110);
      const y = Math.round(box.y + box.height / 2 + 170);
      const menu = page.getByRole('group', { name: '이 위치에서' }).getByRole('button', { name: '본 방 기록하기' });
      const tapped = await page.evaluate(() => performance.now());
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      if (!(await menu.isVisible().catch(() => false))) {
        await menu.waitFor({ timeout: 4000 }).catch(async () => {
          await page.mouse.click(x, y);
          await menu.waitFor({ timeout: timeoutMs });
        });
      }
      const menuAt = await page.evaluate(() => performance.now());
      const accepted = await clickAt(page, menu);
      const state = await waitCreatedVisible(page);
      return {
        ok: true,
        total: span(tapped, state.visibleAt),
        createdId: state.createdId,
        phases: {
          deniedNotice: span(located, deniedAt),
          searchPicked: span(searchStart, picked),
          menuVisible: span(tapped, menuAt),
          saveResponse: span(accepted, (await saveResponseEnd(page, state.saveStart)) ?? state.saveHeadersAt),
          itemVisible: span(tapped, state.visibleAt),
        },
      };
    }),
  cold: (shots) => visitList({ clear: true, screenshot: shots.last }),
  warm: (shots) => visitList({ clear: false, screenshot: shots.last }),
  register: (shots) =>
    registerFlow('register', shots, async (page) => {
      await clickAt(page, locateButton(page));
      const done = await acceptAndWait(page);
      return {
        ok: true,
        total: done.itemVisible,
        createdId: done.state.createdId,
        phases: { saveStart: done.saveStart, saveResponse: done.saveResponse, itemVisible: done.itemVisible },
      };
    }),
  'geo-slow': (shots) =>
    registerFlow('geo-slow', { ...shots, geoDelay: GEO_DELAY_MS }, async (page) => {
      await watchText(page, SUGGESTION_TEXT);
      const located = await clickAt(page, locateButton(page));
      const suggested = await waitText(page, SUGGESTION_TEXT);
      const done = await acceptAndWait(page);
      return {
        ok: true,
        total: span(located, done.state.visibleAt),
        createdId: done.state.createdId,
        phases: {
          suggestionVisible: span(located, suggested),
          saveResponse: typeof done.saveResponse === 'number' ? span(located, done.accepted + done.saveResponse) : null,
          itemVisible: span(located, done.state.visibleAt),
        },
      };
    }),
  denied: (shots) =>
    registerFlow('denied', { ...shots, location: false }, async (page) => {
      await watchText(page, DENIED_TEXT);
      const located = await clickAt(page, locateButton(page));
      const deniedAt = await waitText(page, DENIED_TEXT);
      // 다른 길로 위치 고르기: 주소 검색에서 첫 결과를 고르면 지도 보기로 돌아온다.
      const searchStart = await clickAt(page, page.locator('a[href="/search"]').first());
      await page.getByPlaceholder('주소로 지도 이동').fill('망원동');
      // 목 주소 검색(frontend/src/app/mocks/handlers/mapHandlers.ts)은 늘 이 주소를 준다.
      await page.locator('button', { hasText: '세종대로' }).first().click({ timeout: timeoutMs });
      await page.waitForURL(/view=map/, { timeout: timeoutMs });
      const picked = await page.evaluate(() => performance.now());
      // 고른 주소에 바로 등록하려면 지도를 눌러야 한다. 지도 SDK 목이라 여기서 멈추고, 설정에서 권한을 켠 길로 등록한다.
      await setLocationPermission(true);
      await locateButton(page).waitFor({ timeout: timeoutMs });
      const relocated = await clickAt(page, locateButton(page));
      const done = await acceptAndWait(page);
      return {
        ok: true,
        total: span(relocated, done.state.visibleAt),
        createdId: done.state.createdId,
        selectionRegister: 'map-sdk-stub: 주소로 고른 자리의 등록은 지도를 눌러야 해서 재지 않음',
        phases: {
          deniedNotice: span(located, deniedAt),
          searchPicked: span(searchStart, picked),
          grantedRegister: span(relocated, done.state.visibleAt),
        },
      };
    }),
  'fail-reset': (shots) =>
    registerFlow('fail-reset', shots, async (page) => {
      await fetch(faultsUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ method: 'POST', path: '/api/properties', status: 500, times: 1 }),
      }).then((response) => {
        if (!response.ok) throw new Error(`${ENV_ERROR_PREFIX}실패 주입을 켜지 못했다(serve.mjs --faults 필요)`);
      });
      await watchText(page, SAVE_FAILED_TEXT);
      await clickAt(page, locateButton(page));
      const accepted = await clickAt(page, acceptButton(page));
      const failedAt = await waitText(page, SAVE_FAILED_TEXT);
      const leftover = (await mockList()).length - baselineIds.length;
      if (leftover !== 0) throw new Error(`실패한 저장 뒤 목 목록이 ${leftover}개 늘었다`);
      // 초기화 확인: 다시 "현재 위치로 이동"과 "추가"를 눌러 등록되어야 한다.
      await clickAt(page, locateButton(page));
      const retry = await acceptAndWait(page);
      return {
        ok: true,
        failNotice: span(accepted, failedAt),
        createdId: retry.state.createdId,
        phases: { failNotice: span(accepted, failedAt), retryItemVisible: retry.itemVisible },
      };
    }),
};

const runs = Number(args.runs);
const rows = [];
const record = (row) => {
  rows.push(row);
  appendFileSync(runsFile, `${redact(JSON.stringify(row))}\n`);
  const value = row[SCENARIOS[row.scenario].metric];
  console.log(args.target, row.scenario, row.run, value ?? `실패 ${row.error ?? ''}`, 'bytes', row.bytes);
};

for (let run = 1 - Number(args.warmup); run <= runs; run += 1) {
  const warm = run <= 0;
  for (const scenario of scenarioNames) {
    const shots = {
      last: run === runs ? join(out, `${scenario}-last.png`) : undefined,
      screenshot: run === runs ? join(out, `${scenario}-last.png`) : undefined,
      failShot: warm ? undefined : join(out, `${scenario}-${run}-fail.png`),
    };
    let measured;
    try {
      measured = await SCENARIO_RUNNERS[scenario](shots);
    } catch (error) {
      measured = { ok: false, error: describeError(error) };
    }
    if (measured.error) measured.errorKind = isEnvironmentError(measured.error) ? 'environment' : 'app';
    if (!warm) record({ target: args.target, scenario, run, ...measured });
  }
}
await resetMock().catch((error) => console.error(`::warning::${error}`));
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
    const ok = ofScenario.filter((row) => row.ok);
    const phaseNames = [...new Set(ofScenario.flatMap((row) => Object.keys(row.phases ?? {})))];
    return [
      scenario,
      {
        version: SCENARIOS[scenario].version,
        label: SCENARIOS[scenario].label,
        metric: SCENARIOS[scenario].metric,
        runs: ofScenario.length,
        success: ok.length,
        environmentErrors: ofScenario.filter((row) => row.errorKind === 'environment').length,
        appErrors: ofScenario.filter((row) => row.errorKind === 'app').length,
        ...stats(ok.map((row) => row[SCENARIOS[scenario].metric])),
        phases: Object.fromEntries(phaseNames.map((name) => [name, stats(ok.map((row) => row.phases?.[name]))])),
        bytes: stats(ok.map((row) => row.bytes)),
        errors: ofScenario.filter((row) => !row.ok).map((row) => row.error ?? '순간을 못 봄'),
      },
    ];
  }),
);
const summary = {
  target: args.target,
  base: args.base,
  screen: screen.name,
  moment: screen.moment.label,
  url: listUrl,
  net: args.net,
  cpu: 1,
  mapSdk: args['map-sdk'],
  device: deviceInfo,
  userAgent: rows.find((row) => row.userAgent)?.userAgent ?? null,
  scenarios,
};
writeFileSync(join(out, 'result.json'), `${redact(JSON.stringify(summary, null, 2))}\n`);
console.log(JSON.stringify(summary.scenarios));
