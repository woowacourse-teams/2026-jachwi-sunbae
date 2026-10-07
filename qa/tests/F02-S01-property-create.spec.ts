import type { Locator, Page } from '@playwright/test';

import { isApiResponse, readJson } from '../src/api';
import { expect, test } from '../src/fixtures';
import { type ExpectedOutcome, fail, needsReview, pass, ScenarioRun } from '../src/scenario-run';

// docs/qa/scenarios/F02-S01-property-create.md
const DEPOSIT_MANWON = 500;
const MONTHLY_RENT_MANWON = 50;

type PropertyData = { id: number; name: string; depositAmount: number; monthlyRentAmount: number };
type PropertyBody = { data: PropertyData };
type PropertyListBody = { data: { totalCount: number; items: PropertyData[] } };

// API 금액 단위(만원·원)는 명세가 정하지 않았다. 입력값과 같은 금액으로 해석되면 일치로 본다.
const isSameAmount = (actual: number | undefined, manwon: number): boolean =>
  actual === manwon || actual === manwon * 10_000;

// 화면 금액 표기 형식도 명세가 정하지 않았다. `500만원 / 50만원`처럼 보증금과 월세를 만원 단위로 나란히 보여주는
// 형식만 코드가 읽는다. 읽을 수 있으면 값을 비교해 PASS나 FAIL로 판정하고, 읽을 수 없는 형식은 NEEDS_REVIEW로 넘긴다.
// docs/qa/decision-log/DL-001-amount-mismatch-fail.md
const MANWON_PAIR = /(\d[\d,]*)\s*만\s*원\s*\/\s*(?:월세\s*)?(\d[\d,]*)\s*만\s*원/;

const judgeAmounts = (text: string, actual: string): ExpectedOutcome => {
  const match = MANWON_PAIR.exec(text);
  if (match === null) return needsReview(actual);
  const [deposit, monthlyRent] = [match[1], match[2]].map((value) => Number(value.replaceAll(',', '')));
  return deposit === DEPOSIT_MANWON && monthlyRent === MONTHLY_RENT_MANWON ? pass(actual) : fail(actual);
};

const isShown = (locator: Locator): Promise<boolean> =>
  locator
    .waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true)
    .catch(() => false);

const judgeDetailScreen = async (page: Page, propertyName: string): Promise<ExpectedOutcome> => {
  if (!(await isShown(page.getByText(propertyName).first()))) {
    return fail(`상세 화면에 이름 "${propertyName}"이 보이지 않는다.`);
  }
  const text = await page.locator('body').innerText();
  const amountText = MANWON_PAIR.exec(text)?.[0] ?? '(보증금과 월세 표기를 찾지 못함)';
  return judgeAmounts(text, `이름 "${propertyName}" 표시, 금액 "${amountText}"`);
};

test('F02-S01 정상 매물 등록 후 재조회', async ({ page, member }, testInfo) => {
  const run = ScenarioRun.start('F02-S01', member, page, testInfo);
  const propertyName = `F02-S01 ${member.runId}`;

  await run.execute(async () => {
    // 주소를 고르지 않으면 등록 화면이 기본 위치의 주소를 조회한다. 조회가 끝난 뒤 다음 단계로 넘어간다.
    const defaultLocationLoaded = page
      .waitForResponse(isApiResponse('GET', '/api/maps/reverse-geocode'), { timeout: 15_000 })
      .catch(() => null);

    await test.step('매물 등록 화면으로 이동', async () => {
      await page.getByRole('link', { name: '첫 매물 등록하기' }).click();
      await expect(page).toHaveURL(/\/properties\/new$/);
    });

    await test.step('보증금과 월세 입력', async () => {
      await page.getByLabel('보증금 입력').fill(String(DEPOSIT_MANWON));
      await page.getByLabel('보증금 입력').press('Enter');
      await page.getByLabel('월세 입력').fill(String(MONTHLY_RENT_MANWON));
      await page.getByLabel('월세 입력').press('Enter');
    });

    await test.step('주소는 고르지 않고 다음으로 진행', async () => {
      await defaultLocationLoaded;
      await page.getByRole('button', { name: '다음' }).click();
    });

    await test.step('이름 입력란을 선택해 매물 이름 입력', async () => {
      const nameField = page.getByLabel('매물 이름 입력');
      await nameField.click();
      await nameField.fill(propertyName);
    });

    const createResponse = await test.step('등록', async () => {
      const responsePromise = page.waitForResponse(isApiResponse('POST', '/api/properties'));
      await page.getByRole('button', { name: '매물 등록' }).click();
      return responsePromise;
    });
    await run.captureApi('EV1', createResponse);
    const propertyId = (await readJson<PropertyBody>(createResponse))?.data?.id ?? null;

    await test.step('이동한 화면 확인', async () => {
      await run.check('E1', async () => {
        if (!createResponse.ok() || propertyId === null) {
          return fail(`생성 응답 ${createResponse.status()}, 생성한 매물 ID를 받지 못했다.`);
        }
        await page.waitForURL(new RegExp(`/properties/${propertyId}$`), { timeout: 10_000 }).catch(() => undefined);
        const pathname = new URL(page.url()).pathname;
        const actual = `생성 응답 ${createResponse.status()}, 매물 ID ${propertyId}, 이동한 경로 ${pathname}`;
        return pathname === `/properties/${propertyId}` ? pass(actual) : fail(actual);
      });
      await run.check('E2', () => judgeDetailScreen(page, propertyName));
      await run.captureScreen('EV2');
    });

    if (propertyId === null) {
      throw new Error('생성한 매물 ID를 받지 못해 재조회를 진행할 수 없다.');
    }

    await test.step('새로고침 후 다시 확인', async () => {
      const detailResponsePromise = page.waitForResponse(isApiResponse('GET', `/api/properties/${propertyId}`));
      await page.reload();
      const detailResponse = await detailResponsePromise;
      await run.captureApi('EV3', detailResponse);

      await run.check('E3', async () => {
        const data = (await readJson<PropertyBody>(detailResponse))?.data;
        const apiMatches =
          detailResponse.ok() &&
          data?.name === propertyName &&
          isSameAmount(data.depositAmount, DEPOSIT_MANWON) &&
          isSameAmount(data.monthlyRentAmount, MONTHLY_RENT_MANWON);
        const screen = await judgeDetailScreen(page, propertyName);
        const actual =
          `상세 조회 응답 ${detailResponse.status()}(이름 "${data?.name}", 보증금 ${data?.depositAmount}, 월세 ${data?.monthlyRentAmount}), ` +
          `화면 ${screen.actual}`;
        if (!apiMatches || screen.verdict === 'FAIL') return fail(actual);
        return screen.verdict === 'NEEDS_REVIEW' ? needsReview(actual) : pass(actual);
      });
      await run.captureScreen('EV3');
    });

    await test.step('매물 목록으로 이동', async () => {
      const listResponsePromise = page
        .waitForResponse(isApiResponse('GET', '/api/properties'), { timeout: 10_000 })
        .catch(() => null);
      await page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link', { name: '홈' }).click();
      await expect(page).toHaveURL(/\/properties$/);
      const listResponse = await listResponsePromise;

      await run.check('E4', async () => {
        const cards = page.getByRole('region', { name: '매물 목록' }).getByRole('article');
        await isShown(cards.first());
        const cardCount = await cards.count();
        const cardText = cardCount > 0 ? (await cards.first().innerText()).replace(/\s+/g, ' ') : '';
        const listData = listResponse === null ? null : (await readJson<PropertyListBody>(listResponse))?.data;
        const apiSummary =
          listData === null || listData === undefined ? '목록 조회 응답 없음(캐시 사용)' : `목록 조회 응답 ${listData.totalCount}건`;
        const actual = `목록 카드 ${cardCount}건 "${cardText}", ${apiSummary}`;

        const screenMatches = cardCount === 1 && cardText.includes(propertyName);
        const apiMatches = listData === null || listData === undefined || listData.totalCount === 1;
        if (!screenMatches || !apiMatches) return fail(actual);
        return judgeAmounts(cardText, actual);
      });
      await run.captureScreen('EV4');
    });
  });
});
