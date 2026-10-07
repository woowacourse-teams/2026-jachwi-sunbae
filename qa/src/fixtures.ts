import { test as base } from '@playwright/test';

import { type QaMember, startAsNewMember } from './member';
import { nextRunId } from './run-id';

// QA 실행이 제품 분석 데이터에 섞이지 않도록 분석 요청을 보내지 않는다.
const ANALYTICS_URL = /posthog\.com/;

type QaFixtures = {
  /** 이 테스트만 쓰는 새 회원. 사용하면 로그인한 상태로 매물 목록에서 시작한다. */
  member: QaMember;
};

export const test = base.extend<QaFixtures>({
  context: async ({ context }, use) => {
    await context.route(ANALYTICS_URL, (route) => route.abort());
    await use(context);
  },
  member: async ({ page }, use) => {
    const runId = await nextRunId();
    await use(await startAsNewMember(page, runId));
  },
});

export { expect } from '@playwright/test';
