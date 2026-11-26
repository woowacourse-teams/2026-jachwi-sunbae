// @vitest-environment node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import type {
  CalibrationRecord,
  ScenarioEntry,
} from '../../../.claude/skills/verify-jachwi/scripts/calibration-history.mjs';
import type {
  Candidate,
  ConfirmSide,
  ConfirmSummary,
} from '../../../.claude/skills/verify-jachwi/scripts/calibration-judge.mjs';
import {
  decide,
  finalize,
  findSuspects,
  mergeCandidates,
} from '../../../.claude/skills/verify-jachwi/scripts/calibration-judge.mjs';
import { planIssues } from '../../../.claude/skills/verify-jachwi/scripts/perf-issue.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const scenario = (median: number | null, extra: Partial<ScenarioEntry> = {}): ScenarioEntry => ({
  version: 1,
  label: '방 등록: "추가"를 누르고 새 방 항목이 보이기까지',
  runs: 5,
  success: 5,
  median,
  min: median,
  max: median,
  environmentErrors: 0,
  appErrors: 0,
  errors: [],
  ...extra,
});

const makeRecord = (
  id: string,
  commit: string,
  register: ScenarioEntry,
  { channel = 'prod', event = 'schedule' }: { channel?: CalibrationRecord['channel']; event?: string } = {},
): CalibrationRecord => ({
  id,
  channel,
  event,
  createdAt: '2026-11-30T15:10:00.000Z',
  commit: commit.padEnd(40, '0'),
  runUrl: `https://example.test/runs/${id}`,
  env: {
    webview: 'com.google.android.webview, 124.0.6367.219',
    android: '15 (API 35)',
    abi: 'x86_64',
    net: 'fast4g',
    emulator: 'API 35 google_apis x86_64 pixel_6, swiftshader',
    mockDelay: 300,
    mapSdk: 'stub',
  },
  scenarios: { register },
});

const side = (values: number[], extra: Partial<ConfirmSide> = {}): ConfirmSide => ({
  runs: 5,
  success: values.length,
  environmentErrors: 0,
  appErrors: 0,
  errors: [],
  values,
  median: values.length > 0 ? [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] : null,
  ...extra,
});

const history = [makeRecord('1-1', 'aaa', scenario(1000)), makeRecord('2-1', 'bbb', scenario(1020))];

const confirmOf = (base: ConfirmSide, head: ConfirmSide): ConfirmSummary => ({
  baselineCommit: 'bbb'.padEnd(40, '0'),
  headCommit: 'ccc'.padEnd(40, '0'),
  rounds: 5,
  scenarios: { register: { base, head } },
});

describe('안드로이드 웹뷰 판정: 의심 고르기', () => {
  it('최근 기록보다 문턱(300ms, 20% 중 큰 값) 넘게 느리면 이전 커밋과 다시 잴 의심으로 고른다', () => {
    const suspects = findSuspects(makeRecord('3-1', 'ccc', scenario(1400)), history);

    expect(suspects.scenarios[0]).toMatchObject({ name: 'register', status: 'suspect', kind: 'perf' });
    expect(suspects.confirm).toEqual(['register']);
    expect(suspects.baselineCommit).toBe('bbb'.padEnd(40, '0'));
  });

  it('문턱 안이면 의심하지 않고 다시 재지 않는다', () => {
    const suspects = findSuspects(makeRecord('3-1', 'ccc', scenario(1250)), history);

    expect(suspects.scenarios[0].status).toBe('ok');
    expect(suspects.confirm).toEqual([]);
    expect(suspects.baselineCommit).toBeNull();
  });

  it('환경 오류가 한 번이라도 있거나 표본이 부족하면 판정에서 뺀다', () => {
    const environment = findSuspects(
      makeRecord('3-1', 'ccc', scenario(5000, { environmentErrors: 1, success: 4 })),
      history,
    );
    const insufficient = findSuspects(makeRecord('3-1', 'ccc', scenario(5000, { success: 2 })), history);

    expect(environment.scenarios[0].status).toBe('excluded-environment');
    expect(insufficient.scenarios[0].status).toBe('excluded-insufficient');
    expect(environment.confirm).toEqual([]);
  });

  it('앱 오류(환경 오류가 아닌 실패)가 있으면 기능 의심으로 다시 잰다', () => {
    const suspects = findSuspects(
      makeRecord('3-1', 'ccc', scenario(1000, { appErrors: 2, success: 3, errors: ['새 방 항목을 못 봤다'] })),
      history,
    );

    expect(suspects.scenarios[0]).toMatchObject({ status: 'suspect', kind: 'fix' });
  });
});

describe('안드로이드 웹뷰 판정: 다시 잰 값으로 확인', () => {
  const suspect = { name: 'register', status: 'suspect', kind: 'perf' as const };

  it('같은 러너에서 이번 커밋이 문턱 넘게 느리면 성능 이상으로 확인한다', () => {
    const decision = decide(
      suspect,
      confirmOf(side([1000, 1010, 990, 1005, 1000]), side([1500, 1480, 1520, 1490, 1510])).scenarios.register,
    );

    expect(decision).toMatchObject({ verdict: 'regression-confirmed', diff: 500, threshold: 300 });
  });

  it('다시 재서 차이가 없으면 재현 안 됨, 환경 오류가 섞이면 제외다', () => {
    const same = decide(suspect, confirmOf(side([1000, 1010, 990]), side([1020, 1000, 1010])).scenarios.register);
    const environment = decide(
      suspect,
      confirmOf(side([1000, 1010, 990]), side([1500], { environmentErrors: 2 })).scenarios.register,
    );

    expect(same.verdict).toBe('regression-not-reproduced');
    expect(environment.verdict).toBe('excluded-environment');
  });

  it('같은 문제는 실행이 달라도 같은 키라 후보가 하나로 남고, 같은 실행을 다시 판정해도 결과가 같다', () => {
    const confirm = confirmOf(side([1000, 1010, 990, 1005, 1000]), side([1500, 1480, 1520, 1490, 1510]));
    const first = makeRecord('3-1', 'ccc', scenario(1500));
    const rerun = makeRecord('3-2', 'ccc', scenario(1490));
    const suspects = findSuspects(first, history);
    const once = finalize(first, suspects, confirm, { event: 'schedule' });
    const again = finalize(first, suspects, confirm, { event: 'schedule' });
    const second = finalize(rerun, findSuspects(rerun, history), confirm, { event: 'schedule' });

    expect(once).toEqual(again);
    expect(second.candidates[0].key).toBe(once.candidates[0].key);
    const merged = mergeCandidates(mergeCandidates(null, once.candidates), [...once.candidates, ...second.candidates]);
    expect(Object.keys(merged.candidates)).toHaveLength(1);
    expect(Object.values(merged.candidates)[0].runs).toEqual(['3-1', '3-2']);
    expect(Object.values(merged.candidates)[0].firstSeen).toBe('3-1');
  });

  it('이슈 본문은 팀 템플릿 절을 따르고 실측, 기대 동작, 재현 조건, 실행 링크를 적으며 멘션이 없다', () => {
    const record = makeRecord('3-1', 'ccc', scenario(1500));
    const { candidates } = finalize(
      record,
      findSuspects(record, history),
      confirmOf(side([1000, 1010, 990, 1005, 1000]), side([1500, 1480, 1520, 1490, 1510])),
      { event: 'schedule' },
    );
    const [candidate] = candidates;
    const template = readFileSync(join(repoRoot, '.github/ISSUE_TEMPLATE/issue.md'), 'utf8');
    const sections = [...template.matchAll(/^## (.+)$/gm)].map((match) => match[1]);

    expect(candidate.title).toBe('[FE][Perf] 앱 웹뷰 방 등록이 이전 커밋보다 느려졌다');
    expect([...candidate.body.matchAll(/^## (.+)$/gm)].map((match) => match[1])).toEqual(sections);
    for (const part of ['- 실측:', '- 기대 동작:', '- 재현 조건:', '- 실행 링크: https://example.test/runs/3-1'])
      expect(candidate.body).toContain(part);
    expect(candidate.body).not.toMatch(/@[A-Za-z0-9-]/);
    expect(candidate.body).toContain(`<!-- jachwi-perf-key: ${candidate.key} -->`);
    expect(candidate.publishable).toBe(true);
  });

  it('시험 실행(test 이력이나 정기 실행이 아닌 것)의 후보는 게시하지 않는다', () => {
    const record = makeRecord('3-1', 'ccc', scenario(1500), { channel: 'test', event: 'push' });
    const { candidates } = finalize(
      record,
      findSuspects(record, history),
      confirmOf(side([1000, 1010, 990, 1005, 1000]), side([1500, 1480, 1520, 1490, 1510])),
      { event: 'push' },
    );

    expect(candidates[0].publishable).toBe(false);
  });
});

describe('이슈 게시 갈래', () => {
  const candidate = (key: string, publishable: boolean): Candidate => ({
    key,
    kind: 'perf',
    scenario: 'register',
    channel: publishable ? 'prod' : 'test',
    event: publishable ? 'schedule' : 'push',
    publishable,
    firstSeen: '1-1',
    runs: ['1-1'],
    title: '[FE][Perf] 합성',
    body: `<!-- jachwi-perf-key: ${key} -->\n`,
  });

  it('새 키는 생성, 이미 있는 키는 중복, 시험 후보는 무시, 기존 이슈를 못 읽으면 확인 못 함이다', () => {
    const plan = planIssues([candidate('a', true), candidate('b', true), candidate('c', false)], new Set(['b']));
    const unknown = planIssues([candidate('a', true)], null);

    expect(plan.map((item) => item.action)).toEqual(['create', 'duplicate', 'ignore']);
    expect(unknown[0].action).toBe('unknown');
  });

  it('본문에 멘션처럼 보이는 글자가 있으면 올리지 않는다', () => {
    const mentioned = { ...candidate('d', true), body: '담당 @someone 확인' };

    expect(planIssues([mentioned], new Set())[0].action).toBe('ignore');
  });
});
