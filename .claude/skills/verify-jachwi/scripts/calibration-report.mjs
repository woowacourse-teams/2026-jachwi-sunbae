// 안드로이드 보정 결과를 한 표로 묶는다. .github/workflows/android-webview-calibration.yml 이 부른다.
// 사용: node calibration-report.mjs --dir <결과 폴더> [--run-url <실행 주소>]
// <결과 폴더> 아래: desktop/, mobile/ (measure.mjs 결과), chrome/, webview/ (measure-android.mjs 결과).
// 각 폴더의 stub-hits.txt 는 그 측정 동안 지도 목(map-sdk-stub.mjs)이 받은 요청 수다. 0이면 지도 SDK 주소 돌리기가 안 먹은 것이다.
// 결과: <결과 폴더>/calibration.md(실행 요약), <결과 폴더>/calibration.json
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { median } from './verdict.mjs';

const { values: args } = parseArgs({
  options: { dir: { type: 'string' }, 'run-url': { type: 'string', default: '' } },
});
if (!args.dir) throw new Error('--dir 이 필요하다');
const dir = resolve(args.dir);

const ROWS = [
  { key: 'desktop', label: 'CI 흉내(PR 판정과 같음)', condition: '데스크탑 Chromium 1440, 보통 4G, CPU 4배, 주소 /' },
  { key: 'mobile', label: '흉내, 휴대폰 폭', condition: '데스크탑 Chromium 390, 보통 4G, CPU 4배, 목록 보기' },
  { key: 'chrome', label: '에뮬레이터 크롬', condition: 'Android 크롬, 보통 4G, CPU 제한 없음, 목록 보기' },
  { key: 'webview', label: '에뮬레이터 앱 웹뷰', condition: 'WebView 셸(앱과 같은 설정), 보통 4G, CPU 제한 없음, 목록 보기' },
];

const readLines = (file) =>
  existsSync(file)
    ? readFileSync(file, 'utf8')
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    : [];
const seconds = (ms) => (ms === null || ms === undefined ? '-' : `${(ms / 1000).toFixed(2)}초`);

const rows = ROWS.map((row) => {
  const runs = readLines(join(dir, row.key, 'runs.jsonl'));
  const values = runs.map((run) => run.moment).filter((value) => typeof value === 'number');
  const hitsFile = join(dir, row.key, 'stub-hits.txt');
  const result = existsSync(join(dir, row.key, 'result.json'))
    ? JSON.parse(readFileSync(join(dir, row.key, 'result.json'), 'utf8'))
    : {};
  return {
    ...row,
    measured: runs.length,
    misses: runs.length - values.length,
    values,
    median: values.length > 0 ? median(values) : null,
    min: values.length > 0 ? Math.min(...values) : null,
    max: values.length > 0 ? Math.max(...values) : null,
    stubHits: existsSync(hitsFile) ? Number(readFileSync(hitsFile, 'utf8').trim()) : null,
    userAgent: result.userAgent ?? null,
  };
});
const ci = rows.find((row) => row.key === 'desktop')?.median ?? null;
const ratio = (value) => (ci && value ? `${(value / ci).toFixed(2)}배` : '-');

const lines = [
  '## 안드로이드 웹뷰 보정',
  '',
  '홈의 첫 매물 카드(`article img`)가 보인 시각이다. 같은 운영 빌드, 같은 목 API(300ms), 같은 지도 SDK 목을 쓴다. 빈 캐시 첫 방문이다.',
  '',
  '| 경로 | 조건 | 잰 회수(못 본 회수) | 중앙값 | 최소~최대 | CI 흉내 대비 | 지도 목 요청 |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...rows.map(
    (row) =>
      `| ${row.label} | ${row.condition} | ${row.measured}(${row.misses}) | ${seconds(row.median)} | ${seconds(row.min)}~${seconds(row.max)} | ${ratio(row.median)} | ${row.stubHits ?? '-'} |`,
  ),
  '',
  ...rows.filter((row) => row.userAgent).map((row) => `- ${row.label} UA: \`${row.userAgent}\``),
  '',
  '- 휴대폰 폭 홈은 기본이 지도 보기라(지도 목에서는 매물 표시가 뜨지 않는다) 휴대폰 폭 세 줄은 `/?view=list`로 연다. CI 줄은 PR 판정과 같게 `/`다.',
  '- 흉내 두 줄은 `measure.mjs`가 같은 빌드를 전과 후로 번갈아 연 값을 합친 것이다(그래서 회수가 두 배다).',
  '- 에뮬레이터는 실기기가 아니다. 러너 CPU(KVM, x86_64) 위에서 돌아 저가 휴대폰보다 빠를 수 있다. 셸 앱에는 RN과 네이티브 탭바가 없다.',
  ...(args['run-url'] ? ['', `실행: ${args['run-url']}`] : []),
];
writeFileSync(join(dir, 'calibration.md'), `${lines.join('\n')}\n`);
writeFileSync(join(dir, 'calibration.json'), `${JSON.stringify({ rows }, null, 2)}\n`);
console.log(lines.join('\n'));
