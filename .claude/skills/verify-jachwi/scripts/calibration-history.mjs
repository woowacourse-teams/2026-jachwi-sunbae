// 안드로이드 웹뷰 시나리오 결과를 이력에 쌓고 이번 실행, 직전 실행, 최근 4회를 비교한다.
// .github/workflows/android-webview-calibration.yml 이 부른다. 이력은 운영(calibration-history)과 시험(calibration-history-test)
// 브랜치에 따로 둔다. 어느 쪽에 쓸지는 워크플로가 정하고, 이 스크립트는 받은 폴더에만 쓴다.
// 사용: node calibration-history.mjs --dir <결과 폴더> --history <이력 폴더> --channel prod|test --commit <sha> \
//         --ref <ref> --event <event> --run-url <주소> --run-id <번호> --run-attempt <번호> [--env-file <env.json>]
// - <결과 폴더>/webview/result.json(measure-android.mjs)과 calibration.json(calibration-report.mjs)을 읽는다.
// - <이력 폴더>/android-webview/history.jsonl 에 기록 한 줄을 더하고 SUMMARY.md(장기 요약)를 다시 만든다.
// - <결과 폴더>/record.json(이번 기록)과 <결과 폴더>/history.md(실행 요약에 붙일 비교 표)를 쓴다.
// 비교 규칙:
// - 직전 실행: 이력의 마지막 기록. 같은 커밋이면 "같은 커밋 재실행", 조건(지문)이 다르면 "조건 바뀜"으로 표시한다.
// - 최근 4회: 이번 커밋을 뺀, 같은 조건이고 표본이 충분한 기록을 커밋마다 가장 최근 것 하나씩 골라 최근 4개의 중앙값을 쓴다.
// - 표본 부족: 성공 회수가 MIN_SUCCESS 보다 적으면 표시하고 최근 4회 기준에서 뺀다. 이력이 비었으면 "첫 기록"이다.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { median } from './verdict.mjs';

export const MIN_SUCCESS = 3;
export const RECENT = 4;
const SCHEMA = 1;
const SUMMARY_ROWS = 30;

const seconds = (ms) => (typeof ms === 'number' ? `${(ms / 1000).toFixed(2)}초` : '-');
const kilobytes = (bytes) => (typeof bytes === 'number' ? `${Math.round(bytes / 1024)}KB` : '-');
const signed = (ms) => (typeof ms === 'number' ? `${ms > 0 ? '+' : ''}${(ms / 1000).toFixed(2)}초` : '-');

// 같은 조건인지 가르는 값. 하나라도 다르면 비교 숫자 옆에 "조건 바뀜"을 단다.
export const fingerprint = (record, scenario) => ({
  scenarioVersion: record.scenarios[scenario]?.version ?? null,
  webview: record.env.webview,
  android: record.env.android,
  abi: record.env.abi,
  emulator: record.env.emulator,
  net: record.env.net,
  mockDelay: record.env.mockDelay,
  mapSdk: record.env.mapSdk,
});
const sameFingerprint = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const changedKeys = (a, b) => Object.keys(a).filter((key) => JSON.stringify(a[key]) !== JSON.stringify(b[key]));
export const isSufficient = (entry) => typeof entry?.median === 'number' && (entry.success ?? 0) >= MIN_SUCCESS;

// 이번 기록(record)과 그 전 기록들(history, 오래된 것부터)로 시나리오 하나를 비교한다.
export const compareScenario = (record, history, scenario) => {
  const current = record.scenarios[scenario];
  const flags = [];
  if (!isSufficient(current)) flags.push(`표본 부족(성공 ${current?.success ?? 0}/${current?.runs ?? 0})`);
  const prior = history.filter((entry) => entry.scenarios?.[scenario]);
  if (prior.length === 0) flags.push('첫 기록');
  const mine = fingerprint(record, scenario);
  const previous = prior.at(-1);
  let previousNote = null;
  if (previous) {
    const notes = [];
    if (previous.commit === record.commit) notes.push('같은 커밋 재실행');
    const theirs = fingerprint(previous, scenario);
    if (!sameFingerprint(mine, theirs)) notes.push(`조건 바뀜(${changedKeys(mine, theirs).join(', ')})`);
    if (!isSufficient(previous.scenarios[scenario])) notes.push('직전 표본 부족');
    previousNote = notes.join(', ') || null;
  }
  const latestPerCommit = new Map();
  for (const entry of prior) {
    if (entry.commit === record.commit) continue;
    if (!sameFingerprint(mine, fingerprint(entry, scenario))) continue;
    if (!isSufficient(entry.scenarios[scenario])) continue;
    latestPerCommit.delete(entry.commit);
    latestPerCommit.set(entry.commit, entry);
  }
  const recent = [...latestPerCommit.values()].slice(-RECENT);
  const recentMedians = recent.map((entry) => entry.scenarios[scenario].median);
  const recentMedian = recentMedians.length > 0 ? median(recentMedians) : null;
  if (recent.length > 0 && recent.length < RECENT) flags.push(`최근 같은 조건 ${recent.length}회뿐`);
  return {
    scenario,
    current: {
      median: current?.median ?? null,
      min: current?.min ?? null,
      max: current?.max ?? null,
      success: current?.success ?? 0,
      runs: current?.runs ?? 0,
      bytes: current?.bytes?.median ?? null,
    },
    previous: previous
      ? {
          id: previous.id,
          commit: previous.commit,
          median: previous.scenarios[scenario].median,
          bytes: previous.scenarios[scenario].bytes?.median ?? null,
          runUrl: previous.runUrl,
          note: previousNote,
        }
      : null,
    recent: {
      count: recent.length,
      median: recentMedian,
      min: recentMedians.length > 0 ? Math.min(...recentMedians) : null,
      max: recentMedians.length > 0 ? Math.max(...recentMedians) : null,
      commits: recent.map((entry) => entry.commit.slice(0, 8)),
    },
    diffPrevious:
      isSufficient(current) && isSufficient(previous?.scenarios[scenario])
        ? current.median - previous.scenarios[scenario].median
        : null,
    diffRecent: isSufficient(current) && recentMedian !== null ? current.median - recentMedian : null,
    flags,
  };
};

const scenarioLine = (entry) =>
  entry
    ? `${seconds(entry.median)} (${seconds(entry.min)}~${seconds(entry.max)}, 성공 ${entry.success}/${entry.runs})`
    : '-';

export const renderComparison = (record, comparisons) => {
  const lines = [
    `## 안드로이드 웹뷰 시나리오 (${record.channel === 'prod' ? '운영 이력' : '시험 이력, 운영과 섞지 않음'})`,
    '',
    `커밋 \`${record.commit.slice(0, 8)}\`, 웹뷰 ${record.env.webview}, Android ${record.env.android}(${record.env.abi}), ${record.env.net}, 목 API ${record.env.mockDelay}ms, 지도 SDK ${record.env.mapSdk}`,
    '',
    '| 시나리오 | 이번(중앙값, 범위, 성공) | 직전 | 직전 대비 | 최근 4회 중앙값(회수) | 최근 대비 | 표시 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...comparisons.map((comparison) => {
      const scenario = record.scenarios[comparison.scenario];
      const previous = comparison.previous
        ? `${seconds(comparison.previous.median)} (\`${comparison.previous.commit.slice(0, 8)}\`${comparison.previous.note ? `, ${comparison.previous.note}` : ''})`
        : '-';
      const recent =
        comparison.recent.count > 0
          ? `${seconds(comparison.recent.median)} (${comparison.recent.count}회, ${seconds(comparison.recent.min)}~${seconds(comparison.recent.max)})`
          : '-';
      return `| ${scenario.label} v${scenario.version} | ${scenarioLine(comparison.current)} | ${previous} | ${signed(comparison.diffPrevious)} | ${recent} | ${signed(comparison.diffRecent)} | ${comparison.flags.join(', ') || '-'} |`;
    }),
    '',
    '단계별 중앙값(성공 회차만):',
    '',
    ...Object.entries(record.scenarios).map(
      ([name, scenario]) =>
        `- ${name}: ${Object.entries(scenario.phases ?? {})
          .map(([phase, value]) => `${phase} ${seconds(value)}`)
          .join(', ')}, 받은 바이트 ${kilobytes(scenario.bytes?.median)}`,
    ),
    '',
    '- cold, warm 단계는 탐색 시작부터의 시각이다(목록 요청 시작, 응답 도착, 카드 표시). register 단계는 "추가"를 누른 뒤부터의 시각이다(저장 요청 시작, 저장 응답 도착, 새 방 항목 표시).',
    `- 직전은 이력의 마지막 기록이다. 최근 4회는 이번 커밋을 빼고 같은 조건이며 성공 ${MIN_SUCCESS}회 이상인 기록을 커밋마다 하나씩 고른다.`,
  ];
  return `${lines.join('\n')}\n`;
};

export const renderSummary = (channel, history) => {
  const lines = [
    `# 안드로이드 웹뷰 시나리오 장기 요약 (${channel === 'prod' ? '운영' : '시험'})`,
    '',
    '`.github/workflows/android-webview-calibration.yml`이 실행마다 다시 만든다. 손으로 고치지 않는다. 원자료는 `history.jsonl`이다.',
    `최근 ${SUMMARY_ROWS}개 기록을 새것부터 보인다. 표시: 재실행(직전과 같은 커밋), 조건 바뀜(직전과 웹뷰, 기기, 회선, 목, 시나리오 버전 중 하나가 다름), 표본 부족(성공 ${MIN_SUCCESS}회 미만).`,
  ];
  const names = [...new Set(history.flatMap((entry) => Object.keys(entry.scenarios ?? {})))];
  for (const name of names) {
    const entries = history.filter((entry) => entry.scenarios?.[name]);
    lines.push('', `## ${entries.at(-1).scenarios[name].label} (${name})`, '');
    lines.push('| 날짜(UTC) | 커밋 | 웹뷰 | 시나리오 | 성공 | 중앙값 | 범위 | 받은 바이트 | 표시 | 실행 |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    entries
      .map((entry, index) => {
        const scenario = entry.scenarios[name];
        const before = entries[index - 1];
        const marks = [];
        if (before?.commit === entry.commit) marks.push('재실행');
        if (before && !sameFingerprint(fingerprint(entry, name), fingerprint(before, name))) marks.push('조건 바뀜');
        if (!isSufficient(scenario)) marks.push('표본 부족');
        return `| ${entry.createdAt.slice(0, 16).replace('T', ' ')} | \`${entry.commit.slice(0, 8)}\` | ${entry.env.webview} | v${scenario.version} | ${scenario.success}/${scenario.runs} | ${seconds(scenario.median)} | ${seconds(scenario.min)}~${seconds(scenario.max)} | ${kilobytes(scenario.bytes?.median)} | ${marks.join(', ') || '-'} | [${entry.id}](${entry.runUrl}) |`;
      })
      .reverse()
      .slice(0, SUMMARY_ROWS)
      .forEach((line) => lines.push(line));
  }
  return `${lines.join('\n')}\n`;
};

const readJson = (file) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null);

const main = () => {
  const { values: args } = parseArgs({
    options: {
      dir: { type: 'string' },
      history: { type: 'string' },
      channel: { type: 'string' },
      commit: { type: 'string' },
      ref: { type: 'string', default: '' },
      event: { type: 'string', default: '' },
      'run-url': { type: 'string', default: '' },
      'run-id': { type: 'string', default: '0' },
      'run-attempt': { type: 'string', default: '1' },
      'env-file': { type: 'string' },
    },
  });
  if (!args.dir || !args.history || !args.commit) throw new Error('--dir, --history, --commit 이 필요하다');
  if (!['prod', 'test'].includes(args.channel ?? '')) throw new Error('--channel 은 prod 나 test 다');
  const dir = resolve(args.dir);
  const webview = readJson(join(dir, 'webview', 'result.json'));
  if (!webview) throw new Error('webview/result.json 이 없다. 측정이 돌지 않아 기록하지 않는다');
  const calibration = readJson(join(dir, 'calibration.json'));
  const extraEnv = args['env-file'] ? readJson(resolve(args['env-file'])) : {};
  const record = {
    schema: SCHEMA,
    id: `${args['run-id']}-${args['run-attempt']}`,
    channel: args.channel,
    createdAt: new Date().toISOString(),
    commit: args.commit,
    ref: args.ref,
    event: args.event,
    runUrl: args['run-url'],
    env: {
      ...extraEnv,
      android: `${webview.device.release} (API ${webview.device.sdk})`,
      abi: webview.device.abi,
      model: webview.device.model,
      webview: webview.device.webview,
      chrome: webview.device.chrome,
      net: webview.net,
    },
    scenarios: Object.fromEntries(
      Object.entries(webview.scenarios).map(([name, scenario]) => [
        name,
        {
          version: scenario.version,
          label: scenario.label,
          runs: scenario.runs,
          success: scenario.success,
          median: scenario.median,
          min: scenario.min,
          max: scenario.max,
          phases: Object.fromEntries(Object.entries(scenario.phases).map(([phase, value]) => [phase, value.median])),
          bytes: scenario.bytes,
        },
      ]),
    ),
    calibration: Object.fromEntries((calibration?.rows ?? []).map((row) => [row.key, row.median])),
  };
  const historyDir = join(resolve(args.history), 'android-webview');
  mkdirSync(historyDir, { recursive: true });
  const historyFile = join(historyDir, 'history.jsonl');
  const history = existsSync(historyFile)
    ? readFileSync(historyFile, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line))
        .filter((entry) => entry.channel === args.channel)
    : [];
  if (history.some((entry) => entry.id === record.id)) throw new Error(`이미 기록한 실행이다: ${record.id}`);
  const comparisons = Object.keys(record.scenarios).map((scenario) => compareScenario(record, history, scenario));
  record.flags = Object.fromEntries(comparisons.map((comparison) => [comparison.scenario, comparison.flags]));
  appendFileSync(historyFile, `${JSON.stringify(record)}\n`);
  writeFileSync(join(historyDir, 'SUMMARY.md'), renderSummary(args.channel, [...history, record]));
  writeFileSync(join(dir, 'record.json'), `${JSON.stringify({ record, comparisons }, null, 2)}\n`);
  const markdown = renderComparison(record, comparisons);
  writeFileSync(join(dir, 'history.md'), markdown);
  console.log(markdown);
};

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) main();
