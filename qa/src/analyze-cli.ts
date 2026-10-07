import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { analyzeRun } from './ai-analysis';
// qa/.env의 QA_AI_MODEL 등 환경변수를 불러온다.
import './config';

// 테스트를 다시 실행하지 않고 저장된 Run을 다시 분석한다.
// 사용법: npm run analyze -- runs/F02-S01-261007-094025

const main = async (): Promise<void> => {
  const runDirs = process.argv.slice(2);
  if (runDirs.length === 0) {
    console.error('분석할 Run 디렉터리를 지정하세요. 예: npm run analyze -- runs/F02-S01-261007-094025');
    process.exit(1);
  }

  for (const runDir of runDirs) {
    const absolute = resolve(process.cwd(), runDir);
    if (!existsSync(resolve(absolute, 'result.json'))) {
      console.error(`${runDir}에 result.json이 없습니다.`);
      process.exitCode = 1;
      continue;
    }
    console.log(`AI 분석 중: ${runDir}`);
    const record = await analyzeRun(absolute);
    console.log(record.status === 'COMPLETED' ? `완료: ${absolute}/analysis.json` : `실패: ${record.error}`);
  }
};

void main();
