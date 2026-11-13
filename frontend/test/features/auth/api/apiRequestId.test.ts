// @vitest-environment node
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiBlobRequest, apiRequest, authenticate } from '@/features/auth/api/apiClient';
import { setAuthentication } from '@/features/auth/model/authStore';
import { capturePostHogException } from '@/shared/lib/analytics/posthog';

import { server } from '../../../server';

vi.mock('@/shared/lib/analytics/posthog', () => ({
  capturePostHogException: vi.fn(),
  trackPostHogEvent: vi.fn(),
  resetPostHogIdentity: vi.fn(),
}));
const config = { apiBaseUrl: 'http://localhost:8080' };
const path = '/api/properties/123?private=never-log-query';
const requestId = 'server-request-123';
const headers = { 'X-Request-Id': requestId };
const success = (data: unknown) => ({ code: 'SUCCESS', message: '성공', data });
const error = { code: 'INTERNAL_SERVER_ERROR', message: 'never-log-message', errors: [] };
const parseData = (value: unknown) => value;
const captured = vi.mocked(capturePostHogException);

beforeEach(() => {
  captured.mockClear();
  setAuthentication({ accessToken: 'test-member-token', tokenType: 'Bearer', expiresIn: 900, memberId: 1 });
});

describe('서버 요청 ID 오류 추적', () => {
  it.each([400, 503])('%s 오류 이벤트에 서버 요청 ID와 기존 등급을 기록한다', async (status) => {
    server.use(
      http.get(`${config.apiBaseUrl}/api/properties/123`, () => HttpResponse.json(error, { status, headers })),
    );
    await expect(apiRequest({ config, path, parseData })).rejects.toMatchObject({ requestId, status });
    expect(captured).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        request_id: requestId,
        response_status: status,
        severity: status < 500 ? 'P2' : 'P1',
        request_path: '/api/properties/:id',
      }),
    );
    expect(JSON.stringify(captured.mock.calls)).not.toContain('never-log');
  });

  it.each(['json', 'envelope', 'contract'])('200 이후 %s 실패에도 같은 ID를 보존한다', async (kind) => {
    server.use(
      http.get(`${config.apiBaseUrl}/api/properties/123`, () =>
        kind === 'json'
          ? new HttpResponse('{broken', { headers })
          : HttpResponse.json(kind === 'envelope' ? {} : success({}), { headers }),
      ),
    );
    await expect(
      apiRequest({
        config,
        path,
        parseData: (value) => {
          if (kind === 'contract') throw new Error('never-log-contract');
          return value;
        },
      }),
    ).rejects.toMatchObject({ requestId, status: 200 });
    expect(captured).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        request_id: requestId,
        response_status: 200,
        error_category: 'api_contract',
        severity: 'P1',
      }),
    );
  });

  it('204 응답의 계약 검증 실패도 요청 ID를 보존한다', async () => {
    server.use(
      http.get(`${config.apiBaseUrl}/api/properties/123`, () => new HttpResponse(null, { status: 204, headers })),
    );
    await expect(
      apiRequest({
        config,
        path,
        parseData: () => {
          throw new Error('contract');
        },
      }),
    ).rejects.toMatchObject({ requestId });
  });

  it('Blob HTTP 오류와 허용하지 않는 Content-Type도 요청 ID를 보존한다', async () => {
    server.use(
      http.get(`${config.apiBaseUrl}/api/properties/123`, () => HttpResponse.json(error, { status: 503, headers })),
    );
    await expect(apiBlobRequest({ config, path })).rejects.toMatchObject({ requestId, status: 503 });
    server.use(http.get(`${config.apiBaseUrl}/api/properties/123`, () => new HttpResponse('bad content', { headers })));
    await expect(apiBlobRequest({ config, path })).rejects.toMatchObject({ requestId, status: 200 });
    expect(captured).toHaveBeenLastCalledWith(expect.any(Error), expect.objectContaining({ request_id: requestId }));
  });

  it('Blob 본문을 읽지 못해도 요청 ID를 보존한다', async () => {
    const response = new Response('blob', { headers: { ...headers, 'Content-Type': 'image/png' } });
    vi.spyOn(response, 'blob').mockRejectedValue(new Error('never-log-blob'));
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
    await expect(apiBlobRequest({ config, path })).rejects.toMatchObject({ requestId, status: 200 });
    expect(captured).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ request_id: requestId, severity: 'P1' }),
    );
  });

  it('회원 로그인 응답 파싱 오류에도 서버 ID가 남는다', async () => {
    server.use(http.post(`${config.apiBaseUrl}/api/auth/login`, () => new HttpResponse('{broken', { headers })));
    await expect(authenticate(config)).rejects.toMatchObject({ requestId });
    expect(captured).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ request_id: requestId }));
  });

  it('연결 실패와 요청 ID가 없는 응답에는 request_id 속성을 만들지 않는다', async () => {
    server.use(http.get(`${config.apiBaseUrl}/api/properties/123`, () => HttpResponse.error()));
    await expect(apiRequest({ config, path, parseData })).rejects.toMatchObject({ requestId: null, kind: 'network' });
    expect(captured.mock.calls.at(-1)?.[1]).not.toHaveProperty('request_id');
    server.use(http.get(`${config.apiBaseUrl}/api/properties/123`, () => HttpResponse.json(error, { status: 500 })));
    await expect(apiRequest({ config, path, parseData })).rejects.toMatchObject({ requestId: null });
    expect(captured.mock.calls.at(-1)?.[1]).not.toHaveProperty('request_id');
  });

  it('취소 요청은 오류 이벤트에 기록하지 않는다', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(apiRequest({ config, path, parseData, signal: controller.signal })).rejects.toHaveProperty(
      'name',
      'AbortError',
    );
    expect(captured).not.toHaveBeenCalled();
  });
});
