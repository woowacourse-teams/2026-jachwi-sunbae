import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import AdminLogs from '@/pages/admin/ui/AdminLogs';
import type { AdminLogEntry } from '@/features/admin/api/adminLogsApi';
import { PublicConfigProvider } from '@/shared/config/PublicConfigContext';
import * as posthog from '@/shared/lib/analytics/posthog';

import { server } from '../../server';

const baseUrl = 'http://localhost:8080';
const started = {
  queryId: 'server-query',
  status: 'Scheduled',
  startTime: '2026-11-11T00:00:00Z',
  endTime: '2026-11-11T01:00:00Z',
  logs: null,
};
const entry: AdminLogEntry = {
  timestamp: '2026-11-11T00:10:00Z',
  requestId: 'request-123',
  httpMethod: 'GET',
  path: '/api/properties',
  status: 500,
  durationMs: 12,
  message: 'HTTP request failed',
  errorType: 'IllegalStateException',
  exceptionType: null,
  errorMessage: null,
  stackTrace: null,
};
const success = (data: unknown) => HttpResponse.json({ code: 'SUCCESS', data });
const done = (logs: AdminLogEntry[]) => success({ ...started, status: 'Complete', logs });
const renderLogs = (onUnauthorized = vi.fn()) =>
  render(
    <PublicConfigProvider config={{ apiBaseUrl: baseUrl }}>
      <AdminLogs accessCode="test-only-code" onUnauthorized={onUnauthorized} />
    </PublicConfigProvider>,
  );

describe('관리자 CloudWatch 로그 조회', () => {
  it('선택한 환경·기간·상태를 인증 헤더와 보내고 진행 중 부분 결과는 표시하지 않는다', async () => {
    const user = userEvent.setup();
    const requests: Request[] = [];
    const start = vi.fn(({ request }: { request: Request }) => {
      requests.push(request);
      return success(started);
    });
    let polls = 0;
    server.use(
      http.post(`${baseUrl}/api/admin/log-queries`, start),
      http.get(`${baseUrl}/api/admin/log-queries/server-query`, ({ request }) => {
        requests.push(request);
        polls += 1;
        return polls === 1 ? success({ ...started, status: 'Running', logs: [entry] }) : done([entry]);
      }),
    );
    renderLogs();
    await user.selectOptions(screen.getByLabelText('환경'), 'prod');
    await user.selectOptions(screen.getByLabelText('기간'), '7d');
    await user.selectOptions(screen.getByLabelText('상태'), '5xx');
    await user.click(screen.getByRole('button', { name: '오류 조회' }));
    expect(await screen.findByRole('progressbar', { name: 'CloudWatch 오류 목록 조회 중' })).toBeInTheDocument();
    await waitFor(() => expect(polls).toBe(1), { timeout: 2000 });
    expect(screen.queryByText('/api/properties')).not.toBeInTheDocument();
    expect(screen.queryByText('조회된 API 오류가 없습니다.')).not.toBeInTheDocument();
    expect(await screen.findByText('/api/properties', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText(/2026\. 11\. 11\. (오전|AM) 9:10:00/)).toBeInTheDocument();
    expect(screen.getByText('12 ms')).toBeInTheDocument();
    expect(start).toHaveBeenCalledTimes(1);
    expect(new URL(requests[0].url).searchParams.toString()).toBe('environment=prod&period=7d&status=5xx');
    for (const request of requests) expect(request.headers.get('Authorization')).toBe('Admin test-only-code');
  });

  it('목록의 요청을 선택하면 목록 조회 환경으로 상세 로그와 줄바꿈이 유지된 스택을 표시한다', async () => {
    const user = userEvent.setup();
    const stack = 'java.lang.IllegalStateException: failure\n\tat Example.run(Example.java:1)\nCaused by: failure';
    const searches: URLSearchParams[] = [];
    server.use(
      http.post(`${baseUrl}/api/admin/log-queries`, ({ request }) => {
        const search = new URL(request.url).searchParams;
        searches.push(search);
        return done(
          search.has('requestId')
            ? [
                {
                  ...entry,
                  status: null,
                  message: 'Application failure',
                  exceptionType: 'java.lang.IllegalStateException',
                  errorMessage: 'failure',
                  stackTrace: stack,
                },
                entry,
              ]
            : [entry],
        );
      }),
    );
    renderLogs();
    await user.selectOptions(screen.getByLabelText('환경'), 'prod');
    await user.click(screen.getByRole('button', { name: '오류 조회' }));
    await screen.findByText('/api/properties');
    await user.selectOptions(screen.getByLabelText('환경'), 'dev');
    await user.click(screen.getByRole('button', { name: 'request-123' }));
    const pre = await screen.findByLabelText('예외 스택 트레이스');
    expect(pre.textContent).toBe(stack);
    expect(pre.tagName).toBe('PRE');
    expect(searches[1].get('environment')).toBe('prod');
    expect(searches[1].get('requestId')).toBe('request-123');
    expect(screen.getByText('예외 메시지: failure')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '요청 ID 복사' }));
    expect(await navigator.clipboard.readText()).toBe('request-123');
    expect(await screen.findByText('요청 ID를 복사했습니다.')).toBeInTheDocument();
  });

  it('요청 ID 직접 검색에서 HTTP 200과 스택이 없는 로그도 정상적으로 표시한다', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${baseUrl}/api/admin/log-queries`, ({ request }) => {
        expect(new URL(request.url).searchParams.get('requestId')).toBe('request-200');
        return done([
          { ...entry, requestId: 'request-200', status: 200, errorType: null, message: 'HTTP request completed' },
        ]);
      }),
    );
    renderLogs();
    await user.type(screen.getByLabelText('요청 ID'), 'request-200');
    await user.click(screen.getByRole('button', { name: '요청 ID 조회' }));
    expect(await screen.findByText('200')).toBeInTheDocument();
    expect(screen.getByText('CloudWatch에 기록된 예외 스택 트레이스가 없습니다.')).toBeInTheDocument();
    expect(screen.queryByLabelText('예외 스택 트레이스')).not.toBeInTheDocument();
  });

  it('완료된 빈 목록·상세 결과를 구분하고 수동으로 다시 조회한다', async () => {
    const user = userEvent.setup();
    const start = vi.fn(() => done([]));
    server.use(http.post(`${baseUrl}/api/admin/log-queries`, start));
    renderLogs();
    await user.click(screen.getByRole('button', { name: '오류 조회' }));
    expect(await screen.findByText('조회된 API 오류가 없습니다.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '오류 조회' }));
    await user.type(screen.getByLabelText('요청 ID'), 'missing-id');
    await user.click(screen.getByRole('button', { name: '요청 ID 조회' }));
    expect(await screen.findByText(/해당 기간에 기록된 요청 로그가 없습니다/)).toBeInTheDocument();
    expect(start).toHaveBeenCalledTimes(3);
  });

  it.each([
    ['ADMIN_LOG_ACCESS_DENIED', 'CloudWatch 조회 권한이 없습니다.'],
    ['ADMIN_LOG_GROUP_NOT_FOUND', '선택한 환경의 CloudWatch 로그 그룹을 찾을 수 없습니다.'],
    ['ADMIN_LOG_QUERY_FAILED', 'CloudWatch 조회에 실패했습니다.'],
    ['ADMIN_LOG_QUERY_CANCELLED', 'CloudWatch 조회가 취소되었습니다.'],
    ['ADMIN_LOG_QUERY_TIMEOUT', '로그 조회 제한 시간을 초과했습니다.'],
    ['ADMIN_LOG_QUERY_NOT_FOUND', '조회가 만료되었거나 서버가 재시작되었습니다.'],
  ])('조회 실패 %s를 안내하고 AWS 오류 원문이나 로그를 분석 도구로 전송하지 않는다', async (code, message) => {
    const user = userEvent.setup();
    const capture = vi.spyOn(posthog, 'capturePostHogException');
    server.use(
      http.post(`${baseUrl}/api/admin/log-queries`, () =>
        HttpResponse.json({ code, message: 'private AWS query and token', errors: [] }, { status: 502 }),
      ),
    );
    renderLogs();
    await user.click(screen.getByRole('button', { name: '오류 조회' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.queryByText(/private AWS/)).not.toBeInTheDocument();
    expect(capture).not.toHaveBeenCalled();
  });

  it('결과 확인 중 인증이 만료되면 기존 로그아웃 처리를 호출한다', async () => {
    const user = userEvent.setup();
    const unauthorized = vi.fn();
    server.use(
      http.post(`${baseUrl}/api/admin/log-queries`, () => success(started)),
      http.get(`${baseUrl}/api/admin/log-queries/server-query`, () => new HttpResponse(null, { status: 401 })),
    );
    renderLogs(unauthorized);
    await user.click(screen.getByRole('button', { name: '오류 조회' }));
    await waitFor(() => expect(unauthorized).toHaveBeenCalledOnce(), { timeout: 2000 });
  });

  it('새 상세 요청이 먼저 끝나면 이전 요청의 늦은 결과가 덮어쓰지 않는다', async () => {
    const user = userEvent.setup();
    let release: (() => void) | undefined;
    server.use(
      http.post(`${baseUrl}/api/admin/log-queries`, async ({ request }) => {
        const search = new URL(request.url).searchParams;
        if (!search.has('requestId')) return done([entry, { ...entry, requestId: 'request-new' }]);
        if (search.get('requestId') === 'request-123') {
          await new Promise<void>((resolve) => {
            release = resolve;
          });
          return done([{ ...entry, message: 'old-detail' }]);
        }
        return done([{ ...entry, requestId: 'request-new', message: 'new-detail' }]);
      }),
    );
    renderLogs();
    await user.click(screen.getByRole('button', { name: '오류 조회' }));
    await user.click(await screen.findByRole('button', { name: 'request-123' }));
    await user.click(screen.getByRole('button', { name: 'request-new' }));
    expect(await screen.findByText('new-detail')).toBeInTheDocument();
    release?.();
    const region = screen.getByRole('region', { name: '요청 상세' });
    expect(within(region).queryByText('old-detail')).not.toBeInTheDocument();
  });
});
