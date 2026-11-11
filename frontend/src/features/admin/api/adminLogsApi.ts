import type { PublicConfig } from '@/shared/config/publicConfigTypes';

import { AdminApiError, describeAdminError, requestAdmin } from './adminApi';

export type AdminLogFilters = {
  environment: 'dev' | 'prod';
  period: '1h' | '24h' | '7d';
  status: 'all' | '4xx' | '5xx';
};
export type AdminLogSearch = AdminLogFilters & { requestId?: string };
export type AdminLogEntry = {
  timestamp: string | null;
  requestId: string | null;
  httpMethod: string | null;
  path: string | null;
  memberId: number | null;
  status: number | null;
  durationMs: number | null;
  message: string | null;
  errorType: string | null;
  exceptionType: string | null;
  errorMessage: string | null;
  stackTrace: string | null;
};
export type AdminLogQuery = {
  queryId: string;
  status: 'Scheduled' | 'Running' | 'Complete';
  startTime: string;
  endTime: string;
  logs: AdminLogEntry[] | null;
};

export const createAdminLogQuery = (config: PublicConfig, code: string, search: AdminLogSearch, signal: AbortSignal) =>
  requestAdmin<AdminLogQuery>(config, `/api/admin/log-queries?${new URLSearchParams(search)}`, code, signal, 'POST');
export const fetchAdminLogQuery = (config: PublicConfig, code: string, queryId: string, signal: AbortSignal) =>
  requestAdmin<AdminLogQuery>(config, `/api/admin/log-queries/${encodeURIComponent(queryId)}`, code, signal);

const errorMessages: Record<string, string> = {
  ADMIN_LOG_INPUT_INVALID: '조회 조건과 요청 ID를 확인해 주세요.',
  ADMIN_LOG_QUERY_NOT_FOUND: '조회가 만료되었거나 서버가 재시작되었습니다. 다시 조회해 주세요.',
  ADMIN_LOG_QUERY_LIMIT: '조회가 많습니다. 잠시 후 다시 시도해 주세요.',
  ADMIN_LOG_ACCESS_DENIED: 'CloudWatch 조회 권한이 없습니다. 서버 IAM Role을 확인해 주세요.',
  ADMIN_LOG_GROUP_NOT_FOUND: '선택한 환경의 CloudWatch 로그 그룹을 찾을 수 없습니다.',
  ADMIN_LOG_UNAVAILABLE: 'CloudWatch에 연결하지 못했습니다. 잠시 후 다시 조회해 주세요.',
  ADMIN_LOG_QUERY_FAILED: 'CloudWatch 조회에 실패했습니다. 기간을 줄여 다시 조회해 주세요.',
  ADMIN_LOG_QUERY_CANCELLED: 'CloudWatch 조회가 취소되었습니다. 다시 조회해 주세요.',
  ADMIN_LOG_QUERY_TIMEOUT: '로그 조회 제한 시간을 초과했습니다. 기간을 줄여 다시 조회해 주세요.',
};
export const describeAdminLogError = (error: unknown): string =>
  (error instanceof AdminApiError && error.code ? errorMessages[error.code] : undefined) ?? describeAdminError(error);

export const formatAdminLogTime = (value: string | null): string => {
  if (value === null || Number.isNaN(Date.parse(value))) return '기록 없음';
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'medium' }).format(
    new Date(value),
  );
};
