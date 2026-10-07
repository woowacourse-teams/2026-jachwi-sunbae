import { expect, type Page } from '@playwright/test';

export type QaMember = {
  runId: string;
  nickname: string;
  memberId: number;
};

type LoginResponseBody = {
  data: {
    newMember: boolean;
    member: { memberId: number; name: string };
  };
};

/**
 * 닉네임 `qa-{runId}`로 비밀번호 없이 시작한다(F01).
 * 로그인 응답의 `newMember`로 다른 실행의 회원과 섞이지 않았는지 확인한다.
 */
export const startAsNewMember = async (page: Page, runId: string): Promise<QaMember> => {
  const nickname = `qa-${runId}`;

  await page.goto('/login');
  await page.getByLabel('이름 또는 닉네임').fill(nickname);

  const loginResponsePromise = page.waitForResponse(
    (response) => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/auth/nickname',
  );
  await page.getByRole('button', { name: '이름으로 시작하기' }).click();
  const loginResponse = await loginResponsePromise;

  expect(loginResponse.ok(), `닉네임 로그인 응답이 실패했습니다: ${loginResponse.status()}`).toBe(true);
  const body = (await loginResponse.json()) as LoginResponseBody;
  expect(body.data.newMember, `${nickname}이 이미 있는 회원입니다. 다른 실행의 기록과 섞일 수 있습니다.`).toBe(true);

  await expect(page).toHaveURL(/\/properties$/);

  return { runId, nickname, memberId: body.data.member.memberId };
};
