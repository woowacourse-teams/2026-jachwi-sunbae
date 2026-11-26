// 안드로이드 앱 웹뷰 시나리오 판정. 이력 비교로 이상을 의심하고, 같은 러너에서 이전 커밋과 이번 커밋을 번갈아 다시 재서 확인한 것만
// 이슈 후보로 남긴다. .github/workflows/android-webview-calibration.yml 과 android/run-on-emulator.sh 가 부른다. 숫자만 쓰고 LLM은 쓰지 않는다.
// 명령:
//   suspects        --dir <결과> --history <이력> --channel prod|test --commit <sha> [--mode auto|always|never]
//                   이번 측정을 이력과 견줘 다시 잴 시나리오와 이전 커밋을 JSON으로 낸다(표준 출력).
//   confirm-summary --dir <결과> --baseline-commit <sha> --head-commit <sha>
//                   <결과>/confirm/(base|head)-r<회차>/runs.jsonl 을 모아 <결과>/confirm/summary.json 을 쓴다.
//   finalize        --dir <결과> --history <이력> --channel prod|test --event <event> --run-url <주소> --run-id <번호> --run-attempt <번호>
//                   최종 판정(<결과>/verdict.json, verdict.md)과 이슈 후보(<이력>/android-webview/issues.json)를 쓴다.
// 규칙:
// - 제외: 환경 오류(기기, 연결, 웹뷰 붙기)가 한 번이라도 있거나 성공이 MIN_SUCCESS 미만인 시나리오는 판정하지 않는다.
// - 성능 의심: 최근 같은 조건 기록의 중앙값보다 threshold(기준) 넘게 느리다. 기능 의심: 앱 오류(환경 오류가 아닌 실패)가 있다.
// - 확인: 같은 러너에서 이전 커밋(이력의 가장 최근 다른 커밋)과 이번 커밋을 번갈아 CONFIRM_ROUNDS 회씩 다시 잰다. 차이가 문턱을 넘어야
//   "성능 이상 확인", 이번 커밋에서 다시 실패해야 "기능 실패 확인"이다.
// - 안정 키: 시나리오, 종류, 시나리오 버전, 조건 지문, (성능이면) 이전 커밋, (기능이면) 오류 요지로 만든다. 같은 문제를 다시 재도
//   같은 키라 후보가 하나로 남고, 같은 실행을 다시 판정해도 결과가 같다(멱등).
// - 게시: 운영 이력(prod)의 주 1회 실행(schedule)에서 확인된 후보만 publishable 이다. 게시는 perf-issue.mjs 가 소유자 환경에서 한다.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { SCENARIOS } from './android-scenarios.mjs';
import { buildRecord, compareScenario, fingerprint, isSufficient, MIN_SUCCESS, readHistory } from './calibration-history.mjs';
import { median } from './verdict.mjs';

export const REGRESSION = { relative: 0.2, absolute: 300 };
export const CONFIRM_ROUNDS = 5;
// always 모드(시험)에서 다시 잴 시나리오. 시간을 아끼려고 가벼운 둘만 잰다.
export const ALWAYS_CONFIRM = ['cold', 'register'];
export const threshold = (base) => Math.max(REGRESSION.absolute, Math.round(base * REGRESSION.relative));

const seconds = (ms) => (typeof ms === 'number' ? `${(ms / 1000).toFixed(2)}초` : '-');
const shortHash = (value) => createHash('sha1').update(JSON.stringify(value)).digest('hex').slice(0, 10);

// 이번 커밋보다 앞선, 가장 최근의 다른 커밋 기록.
export const findBaseline = (record, history) =>
  [...history].reverse().find((entry) => entry.commit !== record.commit) ?? null;

export const findSuspects = (record, history, { mode = 'auto' } = {}) => {
  const baseline = findBaseline(record, history);
  const scenarios = Object.keys(record.scenarios).map((name) => {
    const scenario = record.scenarios[name];
    const comparison = compareScenario(record, history, name);
    if ((scenario.environmentErrors ?? 0) > 0) return { name, status: 'excluded-environment' };
    if ((scenario.appErrors ?? 0) > 0) return { name, status: 'suspect', kind: 'fix' };
    if (!isSufficient(scenario)) return { name, status: 'excluded-insufficient' };
    if (comparison.recent.count === 0 || comparison.recent.median === null) return { name, status: 'no-baseline' };
    const limit = threshold(comparison.recent.median);
    if (comparison.diffRecent > limit)
      return { name, status: 'suspect', kind: 'perf', diff: comparison.diffRecent, threshold: limit };
    if (mode === 'always' && ALWAYS_CONFIRM.includes(name)) return { name, status: 'check', kind: 'perf' };
    return { name, status: 'ok', diff: comparison.diffRecent, threshold: limit };
  });
  const confirm =
    mode === 'never' || !baseline
      ? []
      : scenarios.filter((item) => item.status === 'suspect' || item.status === 'check').map((item) => item.name);
  return { headCommit: record.commit, baselineCommit: confirm.length > 0 ? baseline.commit : null, scenarios, confirm };
};

const readRows = (file) =>
  existsSync(file)
    ? readFileSync(file, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    : [];

export const summarizeConfirm = (rowsBySide, { baselineCommit, headCommit, rounds }) => {
  const names = [...new Set(Object.values(rowsBySide).flatMap((rows) => rows.map((row) => row.scenario)))];
  const side = (rows, name) => {
    const ofScenario = rows.filter((row) => row.scenario === name);
    const values = ofScenario.filter((row) => row.ok).map((row) => row[SCENARIOS[name].metric]);
    return {
      runs: ofScenario.length,
      success: values.length,
      environmentErrors: ofScenario.filter((row) => row.errorKind === 'environment').length,
      appErrors: ofScenario.filter((row) => row.errorKind === 'app').length,
      errors: ofScenario.filter((row) => !row.ok).map((row) => row.error),
      values,
      median: values.length > 0 ? median(values) : null,
    };
  };
  return {
    baselineCommit,
    headCommit,
    rounds,
    scenarios: Object.fromEntries(
      names.map((name) => [name, { base: side(rowsBySide.base, name), head: side(rowsBySide.head, name) }]),
    ),
  };
};

const errorSignature = (errors) =>
  (errors.find(Boolean) ?? '알 수 없는 실패')
    .replace(/\d+/g, 'N')
    .replace(/\s+/g, ' ')
    .slice(0, 80);

// 다시 잰 결과로 최종 판정을 낸다.
export const decide = (suspect, confirm) => {
  if (!['suspect', 'check'].includes(suspect.status)) return { verdict: suspect.status };
  if (!confirm) return { verdict: 'not-confirmed' };
  const { base, head } = confirm;
  if (base.environmentErrors > 0 || head.environmentErrors > 0) return { verdict: 'excluded-environment' };
  if (suspect.kind === 'fix') {
    return head.appErrors > 0
      ? { verdict: 'failure-confirmed', baseFailed: base.appErrors > 0 }
      : { verdict: 'failure-not-reproduced' };
  }
  if (base.success < MIN_SUCCESS || head.success < MIN_SUCCESS) return { verdict: 'excluded-insufficient' };
  const diff = head.median - base.median;
  const limit = threshold(base.median);
  return { verdict: diff > limit ? 'regression-confirmed' : 'regression-not-reproduced', diff, threshold: limit };
};

const josa = (word) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0 ? '이' : '가';
};

export const issueKey = (record, name, kind, { baselineCommit, errors }) =>
  [
    'android-webview',
    name,
    kind,
    `v${record.scenarios[name].version}`,
    shortHash(fingerprint(record, name)),
    kind === 'perf' ? `base-${baselineCommit.slice(0, 12)}` : `err-${shortHash(errorSignature(errors))}`,
  ].join('/');

const describeEnv = (record) =>
  `${record.env.emulator ?? '에뮬레이터'}, Android ${record.env.android}(${record.env.abi}), WebView ${record.env.webview}, 회선 ${record.env.net}, 목 API ${record.env.mockDelay ?? '-'}ms, 지도 SDK ${record.env.mapSdk ?? '-'}`;

// 팀 이슈 템플릿(.github/ISSUE_TEMPLATE/issue.md)의 배경, 작업 내용, 완료 조건, 참고 자료를 따른다. 멘션, 라벨, 담당자는 넣지 않는다.
export const renderIssue = ({ key, kind, record, name, confirm, decision }) => {
  const scenario = record.scenarios[name];
  const subject = scenario.label.split(':')[0];
  const base = confirm.base;
  const head = confirm.head;
  const title =
    kind === 'perf'
      ? `[FE][Perf] 앱 웹뷰 ${subject}${josa(subject)} 이전 커밋보다 느려졌다`
      : `[FE][Fix] 앱 웹뷰 ${subject}${josa(subject)} 실패한다`;
  const measured =
    kind === 'perf'
      ? `이번 커밋 \`${confirm.headCommit.slice(0, 8)}\` 중앙값 ${seconds(head.median)}(성공 ${head.success}/${head.runs}), 이전 커밋 \`${confirm.baselineCommit.slice(0, 8)}\` 중앙값 ${seconds(base.median)}(성공 ${base.success}/${base.runs}), 차이 +${seconds(decision.diff)}(문턱 ${seconds(decision.threshold)})`
      : `이번 커밋 \`${confirm.headCommit.slice(0, 8)}\` 실패 ${head.appErrors}/${head.runs}회(${head.errors.filter(Boolean)[0] ?? '-'}), 이전 커밋 \`${confirm.baselineCommit.slice(0, 8)}\` 실패 ${base.appErrors}/${base.runs}회`;
  const expected =
    kind === 'perf'
      ? `이전 커밋과의 차이가 문턱(${seconds(decision.threshold)}) 안이다.`
      : '저장과 화면 갱신이 실패 없이 끝나고 새 방 항목이 보인다.';
  const body = [
    '## 배경',
    '',
    `주 1회 안드로이드 앱 웹뷰 측정에서 "${scenario.label}" 시나리오가 ${kind === 'perf' ? '느려졌고' : '실패했고'}, 같은 러너에서 이전 커밋과 이번 커밋을 번갈아 ${confirm.rounds}회씩 다시 재서 재현했다.`,
    '',
    `- 실측: ${measured}`,
    `- 정기 측정 값: 중앙값 ${seconds(scenario.median)}(범위 ${seconds(scenario.min)}~${seconds(scenario.max)}, 성공 ${scenario.success}/${scenario.runs})`,
    `- 기대 동작: ${expected}`,
    `- 재현 조건: ${describeEnv(record)}, 시나리오 v${scenario.version}`,
    `- 실행 링크: ${record.runUrl}`,
    '',
    '## 작업 내용',
    '',
    `- [ ] \`${confirm.baselineCommit.slice(0, 8)}..${confirm.headCommit.slice(0, 8)}\` 사이 변경에서 원인을 찾는다.`,
    '- [ ] 원인을 고치거나, 의도한 변화면 그 이유를 이 이슈에 남긴다.',
    '',
    '## 완료 조건',
    '',
    `- [ ] 다음 정기 측정에서 이 시나리오가 ${kind === 'perf' ? '이전 커밋과의 차이 문턱 안이다' : '5회 모두 성공한다'}.`,
    '',
    '## 참고 자료',
    '',
    '- 관련 문서: `frontend/docs/android-webview-calibration.md`',
    `- 원자료: 실행 아티팩트 \`android-webview-calibration\`의 \`webview/runs.jsonl\`, \`confirm/\``,
    '- 선행 Issue: 없음',
    '- 후속 Issue: 없음',
    '',
    `<!-- jachwi-perf-key: ${key} -->`,
  ].join('\n');
  return { title, body: `${body}\n` };
};

export const mergeCandidates = (store, candidates) => {
  const next = { candidates: { ...(store?.candidates ?? {}) } };
  for (const candidate of candidates) {
    const before = next.candidates[candidate.key];
    next.candidates[candidate.key] = before
      ? {
          ...candidate,
          firstSeen: before.firstSeen,
          runs: [...new Set([...before.runs, ...candidate.runs])],
          publishable: before.publishable || candidate.publishable,
        }
      : candidate;
  }
  return next;
};

export const finalize = (record, suspects, confirmSummary, meta) => {
  const results = suspects.scenarios.map((suspect) => {
    const confirm = confirmSummary?.scenarios?.[suspect.name];
    const decision = decide(suspect, confirm);
    return { ...suspect, ...decision, confirm: confirm ?? null };
  });
  const candidates = results
    .filter((result) => ['regression-confirmed', 'failure-confirmed'].includes(result.verdict))
    .map((result) => {
      const kind = result.verdict === 'regression-confirmed' ? 'perf' : 'fix';
      const key = issueKey(record, result.name, kind, {
        baselineCommit: confirmSummary.baselineCommit,
        errors: result.confirm.head.errors,
      });
      const issue = renderIssue({
        key,
        kind,
        record,
        name: result.name,
        confirm: { ...result.confirm, baselineCommit: confirmSummary.baselineCommit, headCommit: confirmSummary.headCommit, rounds: confirmSummary.rounds },
        decision: result,
      });
      return {
        key,
        kind,
        scenario: result.name,
        channel: record.channel,
        event: meta.event,
        publishable: record.channel === 'prod' && meta.event === 'schedule',
        headCommit: confirmSummary.headCommit,
        baselineCommit: confirmSummary.baselineCommit,
        firstSeen: record.id,
        runs: [record.id],
        runUrl: record.runUrl,
        ...issue,
      };
    });
  return { results, candidates, rounds: confirmSummary?.rounds ?? null };
};

const VERDICT_TEXT = {
  ok: '이상 없음',
  'no-baseline': '견줄 기록 없음',
  'excluded-environment': '제외(환경 오류)',
  'excluded-insufficient': '제외(표본 부족)',
  'not-confirmed': '의심, 다시 재지 못함',
  'regression-confirmed': '성능 이상 확인',
  'regression-not-reproduced': '성능 이상 재현 안 됨',
  'failure-confirmed': '기능 실패 확인',
  'failure-not-reproduced': '기능 실패 재현 안 됨',
};

export const renderVerdict = (record, suspects, { results, candidates, rounds }) => {
  const lines = [
    '## 안드로이드 웹뷰 판정',
    '',
    suspects.baselineCommit
      ? `다시 잰 이전 커밋 \`${suspects.baselineCommit.slice(0, 8)}\`, 이번 커밋 \`${record.commit.slice(0, 8)}\`(같은 러너, 번갈아 ${rounds ?? CONFIRM_ROUNDS}회씩)`
      : '다시 잴 시나리오가 없거나 견줄 이전 커밋이 없어 다시 재지 않았다.',
    '',
    '| 시나리오 | 첫 판정 | 다시 잰 값(이전, 이번) | 최종 |',
    '| --- | --- | --- | --- |',
    ...results.map((result) => {
      const again = result.confirm
        ? `${seconds(result.confirm.base.median)}(${result.confirm.base.success}/${result.confirm.base.runs}), ${seconds(result.confirm.head.median)}(${result.confirm.head.success}/${result.confirm.head.runs})`
        : '-';
      const first =
        result.status === 'suspect'
          ? `의심(${result.kind === 'perf' ? `+${seconds(result.diff)}` : '실패'})`
          : result.status === 'check'
            ? '시험 확인'
            : (VERDICT_TEXT[result.status] ?? result.status);
      return `| ${result.name} | ${first} | ${again} | ${VERDICT_TEXT[result.verdict] ?? result.verdict} |`;
    }),
    '',
    candidates.length === 0
      ? '- 이슈 후보 없음'
      : candidates.map((candidate) => `- 이슈 후보: ${candidate.title} (\`${candidate.key}\`, 게시 ${candidate.publishable ? '가능' : '안 함: 시험 실행'})`).join('\n'),
  ];
  return `${lines.join('\n')}\n`;
};

const readJson = (file) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null);

const main = () => {
  const [command, ...rest] = process.argv.slice(2);
  const { values: args } = parseArgs({
    args: rest,
    options: {
      dir: { type: 'string' },
      history: { type: 'string' },
      channel: { type: 'string', default: 'test' },
      commit: { type: 'string' },
      mode: { type: 'string', default: 'auto' },
      event: { type: 'string', default: '' },
      'run-url': { type: 'string', default: '' },
      'run-id': { type: 'string', default: '0' },
      'run-attempt': { type: 'string', default: '1' },
      'baseline-commit': { type: 'string' },
      'head-commit': { type: 'string' },
    },
  });
  const dir = resolve(args.dir ?? '.');
  if (command === 'suspects') {
    const record = buildRecord(dir, { runId: 'preview', runAttempt: '0', channel: args.channel, commit: args.commit, env: readJson(join(dir, 'env.json')) ?? {} });
    const suspects = findSuspects(record, readHistory(args.history, args.channel), { mode: args.mode });
    writeFileSync(join(dir, 'suspects.json'), `${JSON.stringify(suspects, null, 2)}\n`);
    console.log(JSON.stringify(suspects));
    return;
  }
  if (command === 'confirm-summary') {
    const confirmDir = join(dir, 'confirm');
    const rowsBySide = { base: [], head: [] };
    let rounds = 0;
    for (const name of existsSync(confirmDir) ? readdirSync(confirmDir) : []) {
      const match = /^(base|head)-r(\d+)$/.exec(name);
      if (!match) continue;
      rounds = Math.max(rounds, Number(match[2]));
      rowsBySide[match[1]].push(...readRows(join(confirmDir, name, 'runs.jsonl')));
    }
    const summary = summarizeConfirm(rowsBySide, {
      baselineCommit: args['baseline-commit'],
      headCommit: args['head-commit'],
      rounds,
    });
    mkdirSync(confirmDir, { recursive: true });
    writeFileSync(join(confirmDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
    console.log(JSON.stringify(summary));
    return;
  }
  if (command === 'finalize') {
    const { record } = readJson(join(dir, 'record.json'));
    const suspects = readJson(join(dir, 'suspects.json')) ?? findSuspects(record, [], { mode: 'never' });
    const outcome = finalize(record, suspects, readJson(join(dir, 'confirm', 'summary.json')), { event: args.event });
    writeFileSync(join(dir, 'verdict.json'), `${JSON.stringify(outcome, null, 2)}\n`);
    const markdown = renderVerdict(record, suspects, outcome);
    writeFileSync(join(dir, 'verdict.md'), markdown);
    if (args.history) {
      const storeFile = join(resolve(args.history), 'android-webview', 'issues.json');
      mkdirSync(join(resolve(args.history), 'android-webview'), { recursive: true });
      const store = mergeCandidates(readJson(storeFile), outcome.candidates);
      writeFileSync(storeFile, `${JSON.stringify(store, null, 2)}\n`);
    }
    console.log(markdown);
    return;
  }
  throw new Error('명령은 suspects, confirm-summary, finalize 중 하나다');
};

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) main();
