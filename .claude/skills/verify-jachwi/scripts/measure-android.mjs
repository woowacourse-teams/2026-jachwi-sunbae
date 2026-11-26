// 안드로이드 보정 측정. 에뮬레이터(adb)의 크롬이나 WebView 셸 앱에서 같은 화면을 여러 번 빈 캐시로 열고 사용자 기준 순간을 잰다.
// PR마다 도는 판정(measure.mjs, 데스크탑 Chromium에 CPU 4배 제한)이 실제 앱 웹뷰와 얼마나 다른지 보려는 것이다.
// 사용(.github/workflows/android-webview-calibration.yml 이 부른다):
//   node .claude/skills/verify-jachwi/scripts/measure-android.mjs --target chrome|webview --base http://localhost:4302 \
//     --screen home --path '/?view=list' --runs 5 --net fast4g --out <폴더>
// - 기기에서 localhost:<포트> 는 adb reverse 로 러너의 serve.mjs 에, 지도 SDK 주소(oapi.map.naver.com)는 명령줄 플래그
//   (host-resolver-rules)로 기기의 127.0.0.1:<map-sdk-port> 에, 그것도 adb reverse 로 map-sdk-stub.mjs 에 간다.
// - chrome: 회차마다 앱 데이터를 지우고(pm clear) Playwright _android.launchBrowser 로 붙는다.
// - webview: android/webview-shell 의 셸 앱(mobile/App.tsx 와 같은 WebView 설정)을 회차마다 지우고 띄운 뒤 웹뷰 디버깅으로 붙는다.
//   RN 앱이 문서 시작 때 넣는 네이티브 맥락 스크립트(mobile/src/webBridge.ts)도 같이 넣는다.
// - CPU 제한은 걸지 않는다(기기 CPU 그대로). 회선은 --net 의 회선 값만 CDP로 건다.
// 결과: <out>/runs.jsonl(회차별 값), <out>/result.json(요약), <out>/last.png(마지막 회차 화면)
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { createNativeContextScript } from '../../../../mobile/src/webBridge.ts';
import { MAP_MARKS, NETWORKS, watchMoment } from './moment-watch.mjs';
import { findScreen } from './screens.mjs';
import { median } from './verdict.mjs';

const { values: args } = parseArgs({
  options: {
    target: { type: 'string' },
    base: { type: 'string', default: 'http://localhost:4302' },
    screen: { type: 'string', default: 'home' },
    // 화면의 주소 대신 열 주소. 휴대폰 폭 홈은 기본이 지도 보기라 목록 카드를 재려면 /?view=list 로 연다.
    path: { type: 'string' },
    runs: { type: 'string', default: '5' },
    warmup: { type: 'string', default: '1' },
    net: { type: 'string', default: 'fast4g' },
    timeout: { type: 'string', default: '45' },
    out: { type: 'string' },
    pkg: { type: 'string', default: 'kr.jachwisunbae.webviewshell' },
    'map-sdk-port': { type: 'string', default: '4443' },
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
const url = new URL(args.path ?? screen.url, args.base).href;
const out = resolve(args.out);
mkdirSync(out, { recursive: true });
const runsFile = join(out, 'runs.jsonl');
writeFileSync(runsFile, '');

// 명령줄 파일은 디버그 가능한 이미지(google_apis)에서만 읽힌다. 크롬은 Playwright 가 chrome-command-line 에 쓴다.
const flags = [`--host-resolver-rules="MAP oapi.map.naver.com 127.0.0.1:${args['map-sdk-port']}"`, '--ignore-certificate-errors'];
const appVersion = JSON.parse(readFileSync(join(repoRoot, 'mobile/package.json'), 'utf8')).version;
// mobile/App.tsx 와 같은 값. 로그인 제공자는 키가 있어야 켜지므로 셸에서는 뺀다.
const nativeContext = createNativeContextScript('android', ['push'], { appVersion, appBuild: null });

const [device] = await _android.devices();
if (!device) throw new Error('adb 기기가 없다');
const sh = async (command) => (await device.shell(command)).toString().trim();
const writeDeviceFile = (path, text) => sh(`echo ${Buffer.from(text).toString('base64')} | base64 -d > ${path}`);

const waitWebViewGone = async () => {
  for (let i = 0; i < 50 && device.webViews().some((view) => view.pkg() === args.pkg); i += 1)
    await new Promise((done) => setTimeout(done, 200));
};

const openPage = async () => {
  if (args.target === 'chrome') {
    await sh('pm clear com.android.chrome');
    await sh('pm grant com.android.chrome android.permission.POST_NOTIFICATIONS').catch(() => {});
    const context = await device.launchBrowser({ args: flags, ignoreHTTPSErrors: true });
    const page = context.pages()[0] ?? (await context.newPage());
    return { context, page, close: () => context.close().catch(() => {}) };
  }
  await sh(`am force-stop ${args.pkg}`);
  await waitWebViewGone();
  await sh(`pm clear ${args.pkg}`);
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

const openOnce = async ({ screenshot } = {}) => {
  const { context, page, close } = await openPage();
  await page.addInitScript(watchMoment, {
    selector: screen.moment.selector,
    text: screen.moment.text,
    mapTiming: false,
    marks: MAP_MARKS,
  });
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
  await cdp.send('Network.enable');
  await cdp.send('Security.setIgnoreCertificateErrors', { ignore: true }).catch(() => {});
  if (condition.net) await cdp.send('Network.emulateNetworkConditions', condition.net);
  const started = Date.now();
  page.goto(url, { waitUntil: 'commit' }).catch(() => {});
  let result = null;
  while (Date.now() < started + Number(args.timeout) * 1000) {
    result = await page.evaluate(() => window.__verify).catch(() => null);
    if (result?.at > 0) break;
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(1000);
  const userAgent = await page.evaluate(() => navigator.userAgent).catch(() => null);
  if (screenshot) await page.screenshot({ path: join(out, 'last.png') }).catch(() => {});
  await close();
  return {
    moment: result?.at > 0 ? Math.round(result.at) : null,
    lcp: result?.lcp ? Math.round(result.lcp) : null,
    what: result?.what ?? null,
    userAgent,
    failedRequests,
  };
};

const runs = Number(args.runs);
for (let warm = 0; warm < Number(args.warmup); warm += 1) await openOnce();
const rows = [];
for (let run = 1; run <= runs; run += 1) {
  const row = { target: args.target, run, ...(await openOnce({ screenshot: run === runs })) };
  rows.push(row);
  appendFileSync(runsFile, `${JSON.stringify(row)}\n`);
  console.log(args.target, run, 'moment', row.moment, 'lcp', row.lcp, 'failed', row.failedRequests.length);
}
await device.close();

const values = rows.map((row) => row.moment).filter((value) => value !== null);
const sorted = [...values].sort((a, b) => a - b);
const summary = {
  target: args.target,
  screen: screen.name,
  moment: screen.moment.label,
  url,
  net: args.net,
  cpu: 1,
  runs,
  misses: runs - values.length,
  values,
  median: values.length === 0 ? null : median(values),
  min: sorted[0] ?? null,
  max: sorted.at(-1) ?? null,
  userAgent: rows.at(-1)?.userAgent ?? null,
};
writeFileSync(join(out, 'result.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary));
