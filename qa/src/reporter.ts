import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

import type { ScenarioResult } from './scenario-run';

// 테스트가 끝난 뒤 Run 디렉터리를 마무리한다.
// trace는 테스트가 끝난 뒤에 만들어지므로 테스트 안이 아니라 리포터에서 Run 디렉터리로 옮긴다.

const REPOSITORY_ROOT = resolve(__dirname, '../..');

const readScenarioResult = (result: TestResult): ScenarioResult | null => {
  const attachment = result.attachments.find((item) => item.name === 'scenario-result.json');
  return attachment?.body === undefined ? null : (JSON.parse(attachment.body.toString('utf-8')) as ScenarioResult);
};

/** 실패한 Run에 Playwright trace를 실패 시 추가 Evidence로 붙인다. */
const attachTrace = (scenarioResult: ScenarioResult, result: TestResult): void => {
  const trace = result.attachments.find((item) => item.name === 'trace' && item.path !== undefined);
  if (trace?.path === undefined || !existsSync(trace.path)) return;

  const runDir = resolve(REPOSITORY_ROOT, scenarioResult.runDir);
  const resultFile = resolve(runDir, 'result.json');
  const saved = JSON.parse(readFileSync(resultFile, 'utf-8')) as ScenarioResult;
  const id = `EV+${saved.evidence.filter((record) => record.id.startsWith('EV+')).length + 1}`;
  const file = `evidence/${id}-trace.zip`;

  copyFileSync(trace.path, resolve(runDir, file));
  saved.evidence.push({ id, kind: '트레이스', file, description: 'Playwright trace (npx playwright show-trace로 열기)' });
  writeFileSync(resultFile, JSON.stringify(saved, null, 2));
};

class QaRunReporter implements Reporter {
  private readonly runs: ScenarioResult[] = [];

  onTestEnd(_test: TestCase, result: TestResult): void {
    const scenarioResult = readScenarioResult(result);
    if (scenarioResult === null) return;
    if (scenarioResult.verdict !== 'PASS') {
      attachTrace(scenarioResult, result);
    }
    this.runs.push(scenarioResult);
  }

  onEnd(): void {
    if (this.runs.length === 0) return;
    console.log('\nQA Run');
    for (const run of this.runs) {
      console.log(`  ${run.verdict.padEnd(12)} ${run.runName}  ${run.runDir}`);
    }
  }

  printsToStdio(): boolean {
    return false;
  }
}

export default QaRunReporter;
