import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '@/features/admin/api/adminLogsApi';
import { useAdminLogs } from '@/features/admin/api/useAdminLogs';
import { PublicConfigProvider } from '@/shared/config/PublicConfigContext';

vi.mock('@/features/admin/api/adminLogsApi', async (original) => ({
  ...(await original<typeof api>()),
  createAdminLogQuery: vi.fn(),
  fetchAdminLogQuery: vi.fn(),
}));
const pending: api.AdminLogQuery = {
  queryId: 'server-query',
  status: 'Running',
  startTime: '2026-11-11T00:00:00Z',
  endTime: '2026-11-11T01:00:00Z',
  logs: null,
};
const filters: api.AdminLogSearch = { environment: 'dev', period: '1h', status: 'all' };
const wrapper = ({ children }: { children: ReactNode }) => (
  <PublicConfigProvider config={{ apiBaseUrl: 'http://localhost:8080' }}>{children}</PublicConfigProvider>
);

beforeEach(() => {
  vi.mocked(api.createAdminLogQuery).mockReset();
  vi.mocked(api.fetchAdminLogQuery).mockReset();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('관리자 로그 폴링 수명', () => {
  it('계속 실행 중이어도 75초 뒤 실패로 종료하고 새 쿼리를 자동 실행하지 않는다', async () => {
    vi.useFakeTimers();
    vi.mocked(api.createAdminLogQuery).mockResolvedValue(pending);
    vi.mocked(api.fetchAdminLogQuery).mockResolvedValue(pending);
    const { result } = renderHook(() => useAdminLogs('test-only-code', vi.fn()), { wrapper });
    await act(async () => {
      void result.current.search(filters);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(75000);
    });
    expect(result.current.state.status).toBe('error');
    if (result.current.state.status === 'error') {
      expect(api.describeAdminLogError(result.current.state.error)).toContain('제한 시간을 초과');
    }
    expect(api.createAdminLogQuery).toHaveBeenCalledOnce();
    const calls = vi.mocked(api.fetchAdminLogQuery).mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(api.fetchAdminLogQuery).toHaveBeenCalledTimes(calls);
  });

  it('화면을 닫으면 대기 중인 폴링과 요청을 취소한다', async () => {
    vi.useFakeTimers();
    vi.mocked(api.createAdminLogQuery).mockResolvedValue(pending);
    const { result, unmount } = renderHook(() => useAdminLogs('test-only-code', vi.fn()), { wrapper });
    await act(async () => {
      void result.current.search(filters);
    });
    const signal = vi.mocked(api.createAdminLogQuery).mock.calls[0][3];
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(75000);
    });
    expect(signal.aborted).toBe(true);
    expect(api.fetchAdminLogQuery).not.toHaveBeenCalled();
  });
});
