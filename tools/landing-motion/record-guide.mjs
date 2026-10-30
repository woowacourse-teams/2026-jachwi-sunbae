// 사용 방법(`/guide`) 영상 네 편을 개발 서버에서 실제로 조작하며 녹화한다. 같은 익명 회원(out/guide/state.json)으로 이어서 찍는다.
// 녹화 중 만든 매물과 메모는 다음 녹화를 시작할 때 지운다. 마지막 녹화의 매물과 메모는 체크리스트 영상에 쓰므로 남는다.
// 실행: 이 폴더에서 `node record-guide.mjs`. 일부만 다시 찍으려면 `node record-guide.mjs memo,property,checklist`.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ffmpegPath from 'ffmpeg-static';
import { chromium } from 'playwright';

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'out/guide');
const only = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const BASE = 'https://dev.jachwi-sunbae.kr';
const VIEW = { width: 390, height: 844 };
const PANGYO = { latitude: 37.3948, longitude: 127.1112 };

// 누르는 자리에 동그란 표시를 잠깐 띄운다.
const TAP_SCRIPT = `
  window.__tap = (x, y) => {
    const dot = document.createElement('div');
    dot.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(107,154,230,.35);border:3px solid rgba(63,111,196,.9);left:'+x+'px;top:'+y+'px;transition:transform .45s ease,opacity .45s ease;';
    document.documentElement.appendChild(dot);
    requestAnimationFrame(() => { dot.style.transform = 'scale(1.5)'; dot.style.opacity = '0'; });
    setTimeout(() => dot.remove(), 600);
  };
`;

const record = async (browser, name, run) => {
  const dir = path.join(out, `raw-${name}`);
  fs.rmSync(dir, { recursive: true, force: true });
  const ctx = await browser.newContext({
    storageState: fs.existsSync(path.join(out, 'state.json')) ? path.join(out, 'state.json') : undefined,
    viewport: VIEW,
    isMobile: true,
    hasTouch: true,
    geolocation: PANGYO,
    permissions: ['geolocation'],
    recordVideo: { dir, size: VIEW },
  });
  await ctx.addInitScript(TAP_SCRIPT);
  const page = await ctx.newPage();
  const startedAt = Date.now();
  let startOffset = 0;
  page.on('pageerror', (e) => console.error(name, 'pageerror', e.message));
  const tap = async (locator) => {
    const box = await locator.boundingBox();
    if (box) await page.evaluate(([x, y]) => window.__tap(x, y), [box.x + box.width / 2, box.y + box.height / 2]);
    await page.waitForTimeout(250);
    await locator.click();
  };
  const tapAt = async (x, y) => {
    await page.evaluate(([px, py]) => window.__tap(px, py), [x, y]);
    await page.waitForTimeout(250);
    await page.mouse.click(x, y);
  };
  const type = (locator, text) => locator.pressSequentially(text, { delay: 70 });
  // 화면이 다 뜬 시점부터 영상을 쓴다.
  const markStart = () => {
    startOffset = (Date.now() - startedAt) / 1000;
  };
  let result;
  try {
    result = await run({ page, tap, tapAt, type, markStart });
    await page.waitForTimeout(1500);
  } catch (error) {
    await page.screenshot({ path: path.join(out, `fail-${name}.png`) });
    console.error(name, 'FAILED', error.message.split('\n')[0]);
  }
  await ctx.storageState({ path: path.join(out, 'state.json') });
  const video = page.video();
  await ctx.close();
  const webm = await video.path();
  const mp4 = path.join(out, `guide-${name}.mp4`);
  const ff = spawnSync(ffmpegPath, ['-y', '-v', 'error', '-ss', String(Math.max(0, startOffset - 0.2)), '-i', webm, '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '30', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
  if (ff.status !== 0) console.error(ff.stderr.toString());
  console.log(name, `${(fs.statSync(mp4).size / 1024).toFixed(0)}KB`, `start ${startOffset.toFixed(1)}s`);
  return result;
};

const moveTo = async ({ page, tap, type }, query) => {
  await tap(page.getByRole('button', { name: '주소 검색 열기' }));
  await page.waitForTimeout(300);
  const input = page.getByPlaceholder(/주소/).first();
  await type(input, query);
  await input.press('Enter');
  await page.waitForTimeout(1200);
  await tap(page.getByRole('button', { name: /^경기/ }).first());
  await page.waitForTimeout(1800);
};

const browser = await chromium.launch();

/** 다시 찍을 때 겹치지 않도록 이 익명 회원의 매물과 영상용 메모를 지운다. 다른 사람 메모는 서버가 거절한다. */
const cleanUp = async () => {
  const ctx = await browser.newContext({ storageState: path.join(out, 'state.json') });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/guide`, { waitUntil: 'networkidle' });
  const log = await page.evaluate(async () => {
    const API = 'https://dev-api.jachwi-sunbae.kr';
    const login = await fetch(`${API}/api/auth/login`, { method: 'POST', credentials: 'include' });
    const auth = { Authorization: `Bearer ${(await login.json()).data.accessToken}` };
    const done = [];
    const list = await (await fetch(`${API}/api/properties`, { headers: auth })).json();
    const properties = list.data?.items ?? [];
    for (const property of properties) {
      const id = property.id ?? property.propertyId;
      done.push(`property ${id} ${(await fetch(`${API}/api/properties/${id}`, { method: 'DELETE', headers: auth })).status}`);
    }
    const q = new URLSearchParams({ minLatitude: '37.35', maxLatitude: '37.38', minLongitude: '127.09', maxLongitude: '127.13' });
    const memos = await (await fetch(`${API}/api/street-memos?${q}`, { headers: auth })).json();
    for (const memo of memos.data ?? []) {
      if (!JSON.stringify(memo).includes('밤에도 골목이 밝아서')) continue;
      const id = memo.id ?? memo.streetMemoId;
      done.push(`memo ${id} ${(await fetch(`${API}/api/street-memos/${id}`, { method: 'DELETE', headers: auth })).status}`);
    }
    return done;
  });
  console.log('cleanup', log.join(', ') || 'nothing');
  await ctx.close();
};
if (fs.existsSync(path.join(out, 'state.json')) && (!only || /memo|property/.test(only))) await cleanUp();
const want = (name) => !only || only.split(',').includes(name);

// 1. 동네 찾기와 필터
if (want('explore'))
  await record(browser, 'explore', async ({ page, tap, type, markStart }) => {
    await page.goto(`${BASE}/neighborhoods`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    markStart();
    await page.waitForTimeout(600);
    const input = page.getByPlaceholder('출퇴근하는 장소 검색');
    await tap(input);
    await type(input, '판교역');
    await input.press('Enter');
    await page.waitForTimeout(1300);
    await tap(page.getByRole('button', { name: '경기도 성남시 분당구 판교역로 지하160' }));
    await page.waitForTimeout(900);
    await tap(page.getByRole('button', { name: /통근/ }).first());
    await page.waitForTimeout(700);
    await tap(page.getByRole('option', { name: '30분 이내' }));
    await page.waitForTimeout(900);
    await tap(page.getByRole('button', { name: /에서 찾기$/ }));
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2500);
    await tap(page.getByRole('button', { name: /^1위/ }));
    await page.waitForTimeout(3000);
  });

// 2. 동네에 거리 메모 남기기
if (want('memo'))
  await record(browser, 'memo', async (h) => {
    const { page, tap, tapAt, type, markStart } = h;
    await page.goto(`${BASE}/properties`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await moveTo(h, '정자일로');
    // 판교 근처의 다른 사람 메모가 찍히지 않도록 정자동으로 옮긴 뒤부터 영상에 쓴다.
    markStart();
    await page.waitForTimeout(600);
    await tap(page.getByRole('button', { name: '추가하기' }));
    await page.waitForTimeout(600);
    await tap(page.getByRole('button', { name: /📝 메모/ }));
    await page.waitForTimeout(900);
    await tapAt(170, 400);
    await page.waitForTimeout(700);
    await tap(page.getByRole('button', { name: '이 위치에 메모 남기기' }));
    await page.waitForTimeout(900);
    await tap(page.getByRole('button', { name: /좋아요/ }));
    const memo = page.getByPlaceholder('예: 늦게까지 여는 세탁소가 있어요');
    await tap(memo);
    await type(memo, '밤에도 골목이 밝아서 늦게 와도 괜찮아요');
    await page.waitForTimeout(500);
    await tap(page.getByRole('button', { name: '메모 남기기', exact: true }));
    await page.waitForTimeout(2500);
  });

// 3. 매물 추가
let propertyUrl = fs.existsSync(path.join(out, 'property-url.txt')) ? fs.readFileSync(path.join(out, 'property-url.txt'), 'utf8') : '';
if (want('property'))
  propertyUrl = await record(browser, 'property', async (h) => {
    const { page, tap, tapAt, type, markStart } = h;
    await page.goto(`${BASE}/properties`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await moveTo(h, '정자일로');
    // 판교 근처의 다른 사람 메모가 찍히지 않도록 정자동으로 옮긴 뒤부터 영상에 쓴다.
    markStart();
    await page.waitForTimeout(600);
    await tap(page.getByRole('button', { name: '추가하기' }));
    await page.waitForTimeout(600);
    await tap(page.getByRole('button', { name: /🏠 매물/ }));
    await page.waitForTimeout(900);
    await tapAt(230, 470);
    await page.waitForTimeout(700);
    await tap(page.getByRole('button', { name: '이 위치로 매물 추가' }));
    await page.waitForTimeout(2500);
    fs.writeFileSync(path.join(out, 'property-url.txt'), page.url());
    await tap(page.getByRole('button', { name: '매물 이름 수정' }));
    await page.waitForTimeout(700);
    const name = page.locator('input:visible').last();
    await name.fill('');
    await type(name, '정자동 원룸');
    // 매물 이름은 시트 없이 그 자리에서 고치고 Enter로 저장한다.
    await name.press('Enter');
    await page.waitForTimeout(1200);
    await tap(page.getByRole('button', { name: '보증금 / 월세 수정' }));
    await page.waitForTimeout(700);
    await type(page.getByLabel('보증금 (만원)'), '1000');
    await type(page.getByLabel('월세 (만원)'), '60');
    await tap(page.getByRole('button', { name: '저장' }));
    await page.waitForTimeout(2000);
    return page.url();
  });

// 4. 체크리스트
if (want('checklist'))
  await record(browser, 'checklist', async ({ page, tap, type, markStart }) => {
    await page.goto(propertyUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    markStart();
    await page.waitForTimeout(500);
    await tap(page.getByRole('tab', { name: '체크리스트' }));
    await page.waitForTimeout(1500);
    const good = page.getByRole('button', { name: '괜찮음' });
    const caution = page.getByRole('button', { name: '주의' });
    await tap(good.nth(0));
    await page.waitForTimeout(700);
    await tap(good.nth(1));
    await page.waitForTimeout(700);
    await tap(caution.nth(2));
    await page.waitForTimeout(700);
    await tap(page.getByRole('button', { name: /곰팡이.*메모 추가/ }));
    await page.waitForTimeout(700);
    const memo = page.getByPlaceholder('확인한 내용을 메모해 주세요.');
    await type(memo, '창가 쪽 천장에 물 자국이 있어요');
    await tap(page.getByRole('button', { name: '저장', exact: true }));
    await page.waitForTimeout(2000);
  });

await browser.close();
