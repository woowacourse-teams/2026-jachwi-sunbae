import type { Response } from '@playwright/test';

/** `page.waitForResponse`에 넘길 API 응답 조건. 경로는 쿼리를 제외하고 정확히 비교한다. */
export const isApiResponse =
  (method: string, pathname: string) =>
  (response: Response): boolean =>
    response.request().method() === method && new URL(response.url()).pathname === pathname;

/** 응답 본문을 JSON으로 읽는다. 본문이 없거나 JSON이 아니면 null이다. */
export const readJson = async <T>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};
