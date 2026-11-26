// @vitest-environment node
import { describe, expect, it } from 'vitest';

import type { CalibrationRecord } from '../../../.claude/skills/verify-jachwi/scripts/calibration-history.mjs';
import {
  compareScenario,
  renderComparison,
  renderSummary,
} from '../../../.claude/skills/verify-jachwi/scripts/calibration-history.mjs';

const makeRecord = (
  id: string,
  commit: string,
  median: number | null,
  { success = 5, webview = 'com.google.android.webview, 124.0.6367.219', version = 1 } = {},
): CalibrationRecord => ({
  id,
  channel: 'test',
  createdAt: `2026-11-${String(10 + Number(id)).padStart(2, '0')}T00:00:00.000Z`,
  commit: commit.padEnd(40, '0'),
  runUrl: `https://example.test/runs/${id}`,
  env: { webview, android: '15 (API 35)', abi: 'x86_64', net: 'fast4g', emulator: 'pixel_6', mockDelay: 300, mapSdk: 'stub' },
  scenarios: {
    cold: { version, label: '빈 캐시 첫 방문', runs: 5, success, median, min: median, max: median, bytes: { median: 1000 } },
  },
});

describe('안드로이드 웹뷰 이력 비교', () => {
  it('이력이 비었으면 첫 기록으로 표시하고 비교 숫자를 내지 않는다', () => {
    const comparison = compareScenario(makeRecord('1', 'aaa', 5000), [], 'cold');

    expect(comparison.flags).toContain('첫 기록');
    expect(comparison.previous).toBeNull();
    expect(comparison.diffPrevious).toBeNull();
  });

  it('직전과 같은 커밋이면 재실행으로 표시하고, 최근 4회 기준에서는 이번 커밋을 뺀다', () => {
    const history = [makeRecord('1', 'aaa', 5000), makeRecord('2', 'bbb', 6000)];
    const comparison = compareScenario(makeRecord('3', 'bbb', 6400), history, 'cold');

    expect(comparison.previous?.note).toBe('같은 커밋 재실행');
    expect(comparison.diffPrevious).toBe(400);
    expect(comparison.recent.commits).toEqual(['aaa00000']);
    expect(comparison.flags).toContain('최근 같은 조건 1회뿐');
  });

  it('최근 4회는 커밋마다 가장 최근 기록 하나씩, 최근 넷의 중앙값이다', () => {
    const history = [
      makeRecord('1', 'c1', 1000),
      makeRecord('2', 'c2', 2000),
      makeRecord('3', 'c2', 2200),
      makeRecord('4', 'c3', 3000),
      makeRecord('5', 'c4', 4000),
      makeRecord('6', 'c5', 5000),
    ];
    const comparison = compareScenario(makeRecord('7', 'c6', 4000), history, 'cold');

    expect(comparison.recent.count).toBe(4);
    expect(comparison.recent.commits).toEqual(['c2000000', 'c3000000', 'c4000000', 'c5000000']);
    expect(comparison.recent.median).toBe(3500);
    expect(comparison.diffRecent).toBe(500);
  });

  it('웹뷰 버전이나 시나리오 버전이 바뀌면 조건 바뀜으로 표시하고 최근 기준에서 뺀다', () => {
    const history = [makeRecord('1', 'aaa', 5000, { webview: 'com.google.android.webview, 120' })];
    const comparison = compareScenario(makeRecord('2', 'bbb', 5200, { version: 2 }), history, 'cold');

    expect(comparison.previous?.note).toBe('조건 바뀜(scenarioVersion, webview)');
    expect(comparison.recent.count).toBe(0);
  });

  it('성공이 3회 미만이면 표본 부족으로 표시하고 차이를 내지 않으며, 그 기록은 다음 비교의 기준에서 빠진다', () => {
    const thin = makeRecord('1', 'aaa', 5000, { success: 2 });
    const comparison = compareScenario(thin, [], 'cold');
    const next = compareScenario(makeRecord('2', 'bbb', 5100), [thin], 'cold');

    expect(comparison.flags).toContain('표본 부족(성공 2/5)');
    expect(next.diffPrevious).toBeNull();
    expect(next.previous?.note).toBe('직전 표본 부족');
    expect(next.recent.count).toBe(0);
  });

  it('비교 표와 장기 요약에 커밋, 웹뷰, 성공 회수, 실행 링크가 남는다', () => {
    const history = [makeRecord('1', 'aaa', 5000)];
    const record = makeRecord('2', 'aaa', 5100);
    const markdown = renderComparison(record, [compareScenario(record, history, 'cold')]);
    const summary = renderSummary('test', [...history, record]);

    expect(markdown).toContain('시험 이력, 운영과 섞지 않음');
    expect(markdown).toContain('같은 커밋 재실행');
    expect(summary).toContain('| 재실행 | [2](https://example.test/runs/2) |');
    expect(summary).toContain('5/5');
  });
});
