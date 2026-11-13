import type { PublicConfig } from '@/shared/config/publicConfigTypes';

import { AdminApiError, describeAdminError, requestAdmin } from './adminApi';
import type { AdminLogFilters } from './adminLogsApi';

export type AdminPostHogSearch = Pick<AdminLogFilters, 'environment' | 'period'> & {
  severity: 'all' | 'P0' | 'P1' | 'P2';
  requestId?: string;
};
export type AdminPostHogException = {
  type: string | null;
  message: string | null;
  frames: { filename: string | null; function: string | null; line: number | null; column: number | null }[] | null;
};
export type AdminPostHogEvent = {
  eventId: string | null;
  timestamp: string | null;
  distinctId: string | null;
  memberId: number | null;
  environment: string | null;
  platform: string | null;
  screenRoute: string | null;
  errorCategory: string | null;
  severity: string | null;
  requestMethod: string | null;
  requestPath: string | null;
  responseStatus: number | null;
  errorCode: string | null;
  requestId: string | null;
  exceptions: AdminPostHogException[] | null;
};
export type AdminPostHogResult = { startTime: string; endTime: string; events: AdminPostHogEvent[] };
export const fetchAdminPostHogErrors = (
  config: PublicConfig,
  accessCode: string,
  search: AdminPostHogSearch,
  signal: AbortSignal,
) =>
  requestAdmin<AdminPostHogResult>(
    config,
    `/api/admin/posthog-errors?${new URLSearchParams(search)}`,
    accessCode,
    signal,
  );

const messages: Record<string, string> = {
  ADMIN_POSTHOG_NOT_CONFIGURED: '서버에 PostHog 조회용 API 키가 설정되지 않았습니다.',
  ADMIN_POSTHOG_INPUT_INVALID: '환경·기간·등급과 요청 ID를 확인해 주세요.',
  ADMIN_POSTHOG_AUTH_FAILED: 'PostHog API 키가 유효하지 않습니다. 서버 설정을 확인해 주세요.',
  ADMIN_POSTHOG_ACCESS_DENIED: 'PostHog 프로젝트의 Query 읽기 권한이 없습니다.',
  ADMIN_POSTHOG_RATE_LIMITED: 'PostHog 조회 한도에 도달했습니다. 잠시 후 다시 조회해 주세요.',
  ADMIN_POSTHOG_TIMEOUT: 'PostHog 조회 제한 시간을 초과했습니다. 기간을 줄여 다시 조회해 주세요.',
  ADMIN_POSTHOG_UNAVAILABLE: 'PostHog 오류를 조회하지 못했습니다. 잠시 후 다시 조회해 주세요.',
};
export const describeAdminPostHogError = (error: unknown) =>
  (error instanceof AdminApiError && error.code ? messages[error.code] : undefined) ?? describeAdminError(error);
