import type { BrowserContext } from '@playwright/test';

// QA 파이프라인 자체를 검증하기 위한 의도적 결함 주입.
// 원인을 아는 실패를 만들어 Evidence 수집과 AI 분석이 원인을 맞게 짚는지 확인한다.
// 제품 코드와 DEV 데이터는 바꾸지 않고, 브라우저가 받는 응답만 바꾼다.

type Fault = {
  description: string;
  apply: (context: BrowserContext) => Promise<void>;
};

const FAULTS: Record<string, Fault> = {
  'detail-rent': {
    description: '매물 상세 조회 응답(GET /api/properties/{id})의 월세를 실제 값의 1/10로 바꾼다.',
    apply: async (context) => {
      await context.route(/\/api\/properties\/\d+(\?.*)?$/, async (route) => {
        if (route.request().method() !== 'GET') {
          await route.fallback();
          return;
        }
        const response = await route.fetch();
        const body = (await response.json()) as { data?: { monthlyRentAmount?: number } };
        if (typeof body.data?.monthlyRentAmount === 'number') {
          body.data.monthlyRentAmount = Math.round(body.data.monthlyRentAmount / 10);
        }
        await route.fulfill({ response, json: body });
      });
    },
  },
};

export type ActiveFault = { name: string; description: string };

/** 환경변수 `QA_FAULT`로 지정한 결함. 지정하지 않으면 null이다. */
export const activeFault = (): ActiveFault | null => {
  const name = process.env.QA_FAULT?.trim();
  if (!name) return null;
  const fault = FAULTS[name];
  if (fault === undefined) {
    throw new Error(`알 수 없는 QA_FAULT '${name}'. 사용 가능: ${Object.keys(FAULTS).join(', ')}`);
  }
  return { name, description: fault.description };
};

export const applyFault = async (context: BrowserContext): Promise<void> => {
  const fault = activeFault();
  if (fault !== null) await FAULTS[fault.name].apply(context);
};
