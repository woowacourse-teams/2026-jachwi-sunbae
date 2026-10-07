import type { TestInfo } from '@playwright/test';

import { qaConfig } from './config';
import type { QaMember } from './member';
import { loadScenario, type ScenarioDoc } from './scenario-doc';

// Expected별 판정(PASS, FAIL, NEEDS_REVIEW, BLOCKED)과 실제 결과 문장, 소요 시간을 JSON으로 남긴다.
// 승인이나 자동화 상태가 아닌 Scenario는 실행을 거부한다.
/** docs/qa/report-schema.md 4.1 Expected 판정값 */
export type Verdict = 'PASS' | 'FAIL' | 'NEEDS_REVIEW' | 'BLOCKED';

export type ExpectedOutcome = {
  verdict: Exclude<Verdict, 'BLOCKED'>;
  actual: string;
};

export const pass = (actual: string): ExpectedOutcome => ({ verdict: 'PASS', actual });
export const fail = (actual: string): ExpectedOutcome => ({ verdict: 'FAIL', actual });
/** 코드로 판정할 수 없어 AI나 사람의 해석이 필요하다. */
export const needsReview = (actual: string): ExpectedOutcome => ({ verdict: 'NEEDS_REVIEW', actual });

export type ExpectedResult = {
  id: string;
  expected: string;
  basis: string;
  verdict: Verdict;
  judgedBy: '코드';
  actual: string;
};

export type ScenarioResult = {
  runName: string;
  runId: string;
  scenario: { id: string; title: string; status: string; path: string };
  environment: { baseUrl: string };
  member: { nickname: string; memberId: number };
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  verdict: Verdict;
  expected: ExpectedResult[];
};

// docs/qa/report-schema.md 4.2: 사람이 먼저 봐야 할 결과를 앞에 둔다.
const VERDICT_PRIORITY: Verdict[] = ['FAIL', 'NEEDS_REVIEW', 'BLOCKED', 'PASS'];
const RUNNABLE_STATUSES = new Set(['승인', '자동화']);

const firstLine = (error: unknown): string =>
  (error instanceof Error ? error.message : String(error)).split('\n')[0].replace(/\u001b\[[0-9;]*m/g, '');

/** Scenario 한 번의 실행(Run)에서 Expected별 판정을 기록한다. */
export class ScenarioRun {
  private readonly results = new Map<string, ExpectedResult>();

  private constructor(
    readonly scenario: ScenarioDoc,
    private readonly member: QaMember,
    private readonly testInfo: TestInfo,
  ) {}

  static start(scenarioId: string, member: QaMember, testInfo: TestInfo): ScenarioRun {
    const scenario = loadScenario(scenarioId);
    // docs/qa/scenarios/README.md: 자동화는 승인된 Scenario만 한다.
    if (!RUNNABLE_STATUSES.has(scenario.status)) {
      throw new Error(`${scenarioId}의 상태가 '${scenario.status}'입니다. 승인된 Scenario만 실행합니다.`);
    }
    return new ScenarioRun(scenario, member, testInfo);
  }

  get runName(): string {
    return `${this.scenario.id}-${this.member.runId}`;
  }

  /** Expected 하나를 판정한다. 판정 중 예외가 나면 실패로 기록한다. */
  async check(expectedId: string, judge: () => Promise<ExpectedOutcome>): Promise<void> {
    const definition = this.scenario.expected.find((expected) => expected.id === expectedId);
    if (definition === undefined) {
      throw new Error(`${expectedId}가 ${this.scenario.path}의 Expected에 없습니다.`);
    }

    let outcome: ExpectedOutcome;
    try {
      outcome = await judge();
    } catch (error) {
      outcome = fail(`확인 중 오류: ${firstLine(error)}`);
    }
    this.results.set(expectedId, {
      id: expectedId,
      expected: definition.text,
      basis: definition.basis,
      verdict: outcome.verdict,
      judgedBy: '코드',
      actual: outcome.actual,
    });
  }

  /**
   * Scenario 단계를 실행하고 결과를 남긴다.
   * 단계가 중간에 멈추면 확인하지 못한 Expected는 BLOCKED다. 최종 판정이 PASS가 아니면 테스트를 실패시킨다.
   */
  async execute(steps: () => Promise<void>): Promise<ScenarioResult> {
    let stepError: unknown = null;
    try {
      await steps();
    } catch (error) {
      stepError = error;
    }

    for (const definition of this.scenario.expected) {
      if (this.results.has(definition.id)) continue;
      this.results.set(definition.id, {
        id: definition.id,
        expected: definition.text,
        basis: definition.basis,
        verdict: 'BLOCKED',
        judgedBy: '코드',
        actual:
          stepError === null
            ? '이 Expected를 확인하는 코드가 실행되지 않았다.'
            : `단계 실행이 멈춰 확인하지 못했다: ${firstLine(stepError)}`,
      });
    }

    const result = this.toResult();
    await this.testInfo.attach('scenario-result.json', {
      body: JSON.stringify(result, null, 2),
      contentType: 'application/json',
    });

    if (result.verdict !== 'PASS') {
      const lines = result.expected
        .filter((expected) => expected.verdict !== 'PASS')
        .map((expected) => `- ${expected.id} ${expected.verdict}: ${expected.actual}`);
      throw new Error(`${this.runName} ${result.verdict}\n${lines.join('\n')}`, { cause: stepError ?? undefined });
    }
    return result;
  }

  private toResult(): ScenarioResult {
    const expected = this.scenario.expected.map((definition) => this.results.get(definition.id)!);
    const verdict = VERDICT_PRIORITY.find((candidate) => expected.some((item) => item.verdict === candidate)) ?? 'PASS';
    const finishedAt = new Date();

    return {
      runName: this.runName,
      runId: this.member.runId,
      scenario: {
        id: this.scenario.id,
        title: this.scenario.title,
        status: this.scenario.status,
        path: this.scenario.path,
      },
      environment: { baseUrl: qaConfig.baseUrl },
      member: { nickname: this.member.nickname, memberId: this.member.memberId },
      startedAt: this.member.startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - this.member.startedAt.getTime(),
      verdict,
      expected,
    };
  }
}
