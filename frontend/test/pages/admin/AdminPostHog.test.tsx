import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import AdminErrorExplorer from '@/pages/admin/ui/AdminErrorExplorer';
import type { AdminPostHogEvent } from '@/features/admin/api/adminPostHogApi';
import { PublicConfigProvider } from '@/shared/config/PublicConfigContext';
import * as posthog from '@/shared/lib/analytics/posthog';

import { server } from '../../server';

const baseUrl = 'http://localhost:8080';
const event: AdminPostHogEvent = {
  eventId: 'event-1',
  timestamp: '2026-11-11T00:10:00Z',
  distinctId: 'member-123',
  memberId: 123,
  environment: 'production',
  platform: 'web',
  screenRoute: '/properties',
  errorCategory: 'api',
  severity: 'P1',
  requestMethod: 'GET',
  requestPath: '/api/properties',
  responseStatus: 200,
  errorCode: 'INVALID_RESPONSE',
  requestId: 'request-123',
  exceptions: [
    {
      type: 'TypeError',
      message: 'JSON parse failure',
      frames: [{ filename: '/app.js', function: 'parse', line: 12, column: 3 }],
    },
  ],
};
const interval = { startTime: '2026-11-11T00:00:00Z', endTime: '2026-11-11T01:00:00Z' };
const success = (data: unknown) => HttpResponse.json({ code: 'SUCCESS', data });
const result = (events: AdminPostHogEvent[] = [event]) => success({ ...interval, events });
const renderExplorer = (onUnauthorized = vi.fn()) =>
  render(
    <StrictMode>
      <PublicConfigProvider config={{ apiBaseUrl: baseUrl }}>
        <AdminErrorExplorer accessCode="test-only-code" onUnauthorized={onUnauthorized} />
      </PublicConfigProvider>
    </StrictMode>,
  );
const openPostHog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'PostHog — 프론트엔드 오류' }));
};

describe('관리자 PostHog 오류 조회', () => {
  it('탭 전환은 자동 조회하지 않으며 선택한 환경·기간·등급·요청 ID로 한 번 조회한다', async () => {
    const user = userEvent.setup();
    const requests: Request[] = [];
    const capture = vi.spyOn(posthog, 'capturePostHogException');
    server.use(
      http.get(`${baseUrl}/api/admin/posthog-errors`, ({ request }) => {
        requests.push(request);
        return result();
      }),
    );
    renderExplorer();
    expect(screen.getByRole('button', { name: 'CloudWatch — 서버 로그' })).toHaveAttribute('aria-pressed', 'true');
    await openPostHog(user);
    expect(requests).toHaveLength(0);
    await user.selectOptions(screen.getByLabelText('환경'), 'prod');
    await user.selectOptions(screen.getByLabelText('기간'), '7d');
    await user.selectOptions(screen.getByLabelText('오류 등급'), 'P1');
    await user.type(screen.getByLabelText('요청 ID (선택)'), 'request-123');
    await user.click(screen.getByRole('button', { name: 'PostHog 오류 조회' }));
    const table = await screen.findByRole('table', { name: 'PostHog 프론트엔드 오류 목록' });
    expect(within(table).getByRole('cell', { name: '123' })).toBeInTheDocument();
    expect(within(table).getByText('production · web')).toBeInTheDocument();
    expect(within(table).getByText('/properties')).toBeInTheDocument();
    expect(within(table).getByText('P1')).toBeInTheDocument();
    expect(within(table).getByText(/2026\. 11\. 11\. (오전|AM) 9:10:00/)).toBeInTheDocument();
    expect(new URL(requests[0].url).searchParams.toString()).toBe(
      'environment=prod&period=7d&severity=P1&requestId=request-123',
    );
    expect(requests[0].headers.get('Authorization')).toBe('Admin test-only-code');
    expect(capture).not.toHaveBeenCalled();
    expect(requests).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'JSON parse failure' }));
    const detail = screen.getByRole('region', { name: 'PostHog 오류 상세' });
    expect(within(detail).getByText('TypeError')).toBeInTheDocument();
    expect(within(detail).getByText('GET /api/properties')).toBeInTheDocument();
    expect(within(detail).getByText('200 · INVALID_RESPONSE')).toBeInTheDocument();
    expect(within(detail).getByLabelText('PostHog 예외 스택').textContent).toBe('parse (/app.js:12:3)');
    expect(within(detail).getByRole('link', { name: 'PostHog에서 확인 ↗' })).toHaveAttribute(
      'href',
      'https://us.posthog.com/project/579863',
    );
    await user.click(screen.getByRole('button', { name: '요청 ID 복사' }));
    expect(await navigator.clipboard.readText()).toBe('request-123');
    expect(requests).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'PostHog 오류 조회' }));
    await waitFor(() => expect(requests).toHaveLength(2));
  });

  it.each([false, true])(
    'PostHog 조회 당시 환경·기간으로 기존 CloudWatch 조회를 연결한다 (빈 결과: %s)',
    async (empty) => {
      const user = userEvent.setup();
      const searches: URLSearchParams[] = [];
      const logs = empty
        ? []
        : [
            {
              timestamp: event.timestamp,
              memberId: 123,
              requestId: event.requestId,
              httpMethod: 'GET',
              path: '/api/properties',
              status: 200,
              durationMs: 10,
              message: 'HTTP request completed',
              errorType: null,
              exceptionType: null,
              errorMessage: null,
              stackTrace: null,
            },
          ];
      const poll = vi.fn(() => success({ ...interval, queryId: 'server-query', status: 'Complete', logs }));
      server.use(
        http.get(`${baseUrl}/api/admin/posthog-errors`, () => result()),
        http.post(`${baseUrl}/api/admin/log-queries`, ({ request }) => {
          searches.push(new URL(request.url).searchParams);
          return success({ ...interval, queryId: 'server-query', status: 'Scheduled', logs: null });
        }),
        http.get(`${baseUrl}/api/admin/log-queries/server-query`, poll),
      );
      renderExplorer();
      await openPostHog(user);
      await user.selectOptions(screen.getByLabelText('환경'), 'prod');
      await user.selectOptions(screen.getByLabelText('기간'), '24h');
      await user.click(screen.getByRole('button', { name: 'PostHog 오류 조회' }));
      await user.click(await screen.findByRole('button', { name: 'JSON parse failure' }));
      await user.selectOptions(screen.getByLabelText('환경'), 'dev');
      await user.selectOptions(screen.getByLabelText('기간'), '1h');
      await user.click(screen.getByRole('button', { name: '서버 로그 확인' }));
      expect(screen.getByRole('button', { name: 'CloudWatch — 서버 로그' })).toHaveAttribute('aria-pressed', 'true');
      if (empty)
        expect(
          await screen.findByText(/해당 기간에 기록된 요청 로그가 없습니다/, {}, { timeout: 3000 }),
        ).toBeInTheDocument();
      else {
        expect(await screen.findByText('HTTP request completed', {}, { timeout: 3000 })).toBeInTheDocument();
        const detail = screen.getByRole('region', { name: '요청 상세' });
        expect(within(detail).getByText('200')).toBeInTheDocument();
        expect(within(detail).getByText('123')).toBeInTheDocument();
      }
      expect(searches).toHaveLength(1);
      expect(searches[0].toString()).toBe('environment=prod&period=24h&status=all&requestId=request-123');
      expect(poll).toHaveBeenCalledOnce();
      expect(screen.getByLabelText('요청 ID')).toHaveValue('request-123');
    },
  );

  it('숫자형 익명 ID와 누락된 예외 정보는 추정하지 않고 서버 연결이 불가능함을 안내한다', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${baseUrl}/api/admin/posthog-errors`, () =>
        result([{ ...event, distinctId: '456', memberId: null, exceptions: null, requestId: null }]),
      ),
    );
    renderExplorer();
    await openPostHog(user);
    await user.click(screen.getByRole('button', { name: 'PostHog 오류 조회' }));
    await user.click(await screen.findByRole('button', { name: '오류 상세 보기' }));
    expect(screen.getByText(/익명 이벤트의 회원을 추정하지 않습니다/)).toBeInTheDocument();
    expect(screen.getByText('요청 ID가 없어 연결할 서버 로그가 없습니다.')).toBeInTheDocument();
    expect(screen.getByText('PostHog에 기록된 예외 스택 정보가 없습니다.')).toBeInTheDocument();
    expect(screen.getByText('PostHog에 기록된 예외 유형과 메시지가 없습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '서버 로그 확인' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('PostHog 예외 스택')).not.toBeInTheDocument();
  });

  it('조회 중과 완료된 빈 결과를 구분한다', async () => {
    const user = userEvent.setup();
    let release: (() => void) | undefined;
    server.use(
      http.get(`${baseUrl}/api/admin/posthog-errors`, async () => {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return result([]);
      }),
    );
    renderExplorer();
    await openPostHog(user);
    await user.click(screen.getByRole('button', { name: 'PostHog 오류 조회' }));
    expect(await screen.findByRole('progressbar', { name: 'PostHog 오류 조회 중' })).toBeInTheDocument();
    expect(screen.queryByText('조회된 PostHog 오류가 없습니다.')).not.toBeInTheDocument();
    release?.();
    expect(await screen.findByText('조회된 PostHog 오류가 없습니다.')).toBeInTheDocument();
  });

  it.each([
    ['ADMIN_POSTHOG_NOT_CONFIGURED', '서버에 PostHog 조회용 API 키가 설정되지 않았습니다.'],
    ['ADMIN_POSTHOG_AUTH_FAILED', 'PostHog API 키가 유효하지 않습니다.'],
    ['ADMIN_POSTHOG_ACCESS_DENIED', 'PostHog 프로젝트의 Query 읽기 권한이 없습니다.'],
    ['ADMIN_POSTHOG_RATE_LIMITED', 'PostHog 조회 한도에 도달했습니다.'],
    ['ADMIN_POSTHOG_TIMEOUT', 'PostHog 조회 제한 시간을 초과했습니다.'],
    ['ADMIN_POSTHOG_UNAVAILABLE', 'PostHog 오류를 조회하지 못했습니다.'],
  ])('%s를 안전한 안내로 표시하며 PostHog로 다시 수집하지 않는다', async (code, message) => {
    const user = userEvent.setup();
    const capture = vi.spyOn(posthog, 'capturePostHogException');
    server.use(
      http.get(`${baseUrl}/api/admin/posthog-errors`, () =>
        HttpResponse.json(
          { code, message: 'private-token-query' },
          { status: code === 'ADMIN_POSTHOG_NOT_CONFIGURED' ? 503 : 502 },
        ),
      ),
    );
    renderExplorer();
    await openPostHog(user);
    await user.click(screen.getByRole('button', { name: 'PostHog 오류 조회' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.queryByText(/private-token/)).not.toBeInTheDocument();
    expect(capture).not.toHaveBeenCalled();
  });

  it('관리자 코드가 유효하지 않으면 기존 로그아웃 처리를 호출한다', async () => {
    const user = userEvent.setup();
    const logout = vi.fn();
    server.use(http.get(`${baseUrl}/api/admin/posthog-errors`, () => new HttpResponse(null, { status: 401 })));
    renderExplorer(logout);
    await openPostHog(user);
    await user.click(screen.getByRole('button', { name: 'PostHog 오류 조회' }));
    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
  });

  it('탭을 나가면 진행 중 요청을 취소하고 늦은 결과를 표시하지 않는다', async () => {
    const user = userEvent.setup();
    let release: (() => void) | undefined;
    let signal: AbortSignal | undefined;
    server.use(
      http.get(`${baseUrl}/api/admin/posthog-errors`, async ({ request }) => {
        signal = request.signal;
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return result();
      }),
    );
    renderExplorer();
    await openPostHog(user);
    await user.click(screen.getByRole('button', { name: 'PostHog 오류 조회' }));
    await waitFor(() => expect(signal).toBeDefined());
    await user.click(screen.getByRole('button', { name: 'CloudWatch — 서버 로그' }));
    expect(signal?.aborted).toBe(true);
    release?.();
    await openPostHog(user);
    expect(screen.queryByText('JSON parse failure')).not.toBeInTheDocument();
    expect(screen.getByText('조건을 선택하고 PostHog 오류 조회를 눌러 주세요.')).toBeInTheDocument();
  });
});
