import { expect, type Locator, type Page } from '@playwright/test';

// 매물 등록 화면(F02)의 입력란과 조작. 여러 Scenario가 같은 화면을 쓰므로 선택자를 한곳에 둔다.

export const propertyForm = (page: Page) => ({
  deposit: page.getByLabel('보증금 입력'),
  monthlyRent: page.getByLabel('월세 입력'),
  name: page.getByLabel('매물 이름 입력'),
  next: page.getByRole('button', { name: '다음' }),
  submit: page.getByRole('button', { name: '매물 등록' }),
  close: page.getByRole('link', { name: '매물 등록 닫기' }),
});

/** 빈 매물 목록에서 매물 등록 화면을 연다. */
export const openCreateFormFromEmptyList = async (page: Page): Promise<void> => {
  await page.getByRole('link', { name: '첫 매물 등록하기' }).click();
  await expect(page).toHaveURL(/\/properties\/new$/);
};

/**
 * 입력란이 오류 상태이면 입력란에 연결된 안내 문구를 돌려준다. 오류 상태가 아니면 null이다.
 * 안내가 화면에 보이는지가 아니라 입력란과 연결되어 있는지를 본다. 화면 읽기 프로그램 사용자도 같은 안내를 받는다.
 */
export const readFieldError = async (field: Locator): Promise<string | null> => {
  if ((await field.getAttribute('aria-invalid')) !== 'true') return null;
  const describedBy = (await field.getAttribute('aria-describedby'))?.split(/\s+/) ?? [];
  const texts = await Promise.all(
    describedBy.map((id) =>
      field
        .page()
        .locator(`[id="${id}"]`)
        .innerText()
        .catch(() => ''),
    ),
  );
  return texts
    .map((text) => text.trim())
    .filter((text) => text.length > 0)
    .join(' / ');
};
