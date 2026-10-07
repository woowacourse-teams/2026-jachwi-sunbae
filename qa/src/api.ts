import type { Page, Request, Response } from '@playwright/test';

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

export type WatchedRequest = {
  method: string;
  url: string;
  /** 응답을 받지 못했으면 null이다. */
  status: number | null;
  requestId: string | null;
};

export type RequestWatch = {
  /** 감시 대상 요청. 예: `POST /api/properties` */
  label: string;
  /** 감시를 멈추고 그동안 보낸 요청을 돌려준다. 요청이 없으면 빈 배열이다. */
  stop: () => Promise<WatchedRequest[]>;
};

/** 지정한 요청을 감시한다. 요청이 "없었음"을 확인할 때도 쓴다. */
export const watchRequests = (page: Page, method: string, pathname: string): RequestWatch => {
  const requests: Request[] = [];
  const onRequest = (request: Request): void => {
    if (request.method() === method && new URL(request.url()).pathname === pathname) requests.push(request);
  };
  page.on('request', onRequest);

  return {
    label: `${method} ${pathname}`,
    stop: async () => {
      page.off('request', onRequest);
      return Promise.all(
        requests.map(async (request) => {
          const response = await request.response().catch(() => null);
          return {
            method: request.method(),
            url: request.url(),
            status: response?.status() ?? null,
            requestId: response?.headers()['x-request-id'] ?? null,
          };
        }),
      );
    },
  };
};
