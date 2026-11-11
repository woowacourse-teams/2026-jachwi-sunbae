import type { PublicConfig } from '@/shared/config/publicConfigTypes';

export type AdminSummary = { activeAccounts: number; newAccountsToday: number; activeProperties: number };
export type AdminMember = {
  memberId: number;
  createdAt: string;
  activeProperties: number;
  activePhotos: number;
};

export class AdminApiError extends Error {
  constructor(
    readonly status: number | null,
    readonly code?: string,
  ) {
    super('관리자 요청을 처리하지 못했습니다.');
    this.name = 'AdminApiError';
  }
}

// 회원 자동 로그인과 PostHog 오류 수집에 연결하지 않는다.
export const requestAdmin = async <T>(
  config: PublicConfig,
  path: string,
  accessCode: string,
  signal?: AbortSignal,
  method = 'GET',
): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(new URL(path, new URL(config.apiBaseUrl).origin), {
      headers: { Accept: 'application/json', Authorization: `Admin ${accessCode}` },
      method,
      cache: 'no-store',
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new AdminApiError(null);
  }
  if (!response.ok) {
    let code: string | undefined;
    try {
      const body: unknown = await response.json();
      if (
        typeof body === 'object' &&
        body !== null &&
        'code' in body &&
        typeof body.code === 'string' &&
        /^ADMIN_(?:LOG|POSTHOG)_[A-Z_]{1,40}$/.test(body.code)
      )
        code = body.code;
    } catch {
      /* 오류 본문 원문은 보관하거나 분석 도구에 전달하지 않는다. */
    }
    throw new AdminApiError(response.status, code);
  }
  try {
    const envelope = (await response.json()) as { code: string; data: T };
    if (envelope.code !== 'SUCCESS' || envelope.data == null) throw new AdminApiError(response.status);
    return envelope.data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new AdminApiError(response.status);
  }
};

export const fetchAdminSummary = (config: PublicConfig, accessCode: string, signal?: AbortSignal) =>
  requestAdmin<AdminSummary>(config, '/api/admin/summary', accessCode, signal);
export const fetchAdminMembers = (config: PublicConfig, accessCode: string, signal?: AbortSignal) =>
  requestAdmin<AdminMember[]>(config, '/api/admin/members', accessCode, signal);
export const isAdminUnauthorized = (error: unknown): boolean => error instanceof AdminApiError && error.status === 401;
export const describeAdminError = (error: unknown): string =>
  isAdminUnauthorized(error)
    ? '접속 코드를 확인해 주세요.'
    : '관리자 정보를 불러오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.';
