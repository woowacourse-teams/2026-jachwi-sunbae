// @vitest-environment node
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { ApiError, apiRequest, getApiErrorTrackingContext, resetAuthentication } from '@/features/auth/api/apiClient';
import {
  clearAuthentication,
  getAccessToken,
  getAuthenticationSnapshot,
  setAuthentication,
} from '@/features/auth/model/authStore';
import { propertyQueryKeys } from '@/features/property/api/propertyQueryKeys';
import { queryClient } from '@/shared/api/queryClient';
import type { PublicConfig } from '@/shared/config/publicConfigTypes';

import { server } from '../../../server';

const config: PublicConfig = {
  apiBaseUrl: 'http://localhost:8080',
};

const success = (data: unknown) => HttpResponse.json({ code: 'SUCCESS', message: '요청에 성공했습니다.', data });

describe('API 클라이언트', () => {
  it('API 오류를 대응 우선순위와 종류로 분류한다', () => {
    expect(getApiErrorTrackingContext(new ApiError({ kind: 'network' }))).toEqual({
      error_category: 'network',
      severity: 'P2',
    });
    expect(getApiErrorTrackingContext(new Error('서버 오류'), 503)).toEqual({
      error_category: 'api_server',
      severity: 'P1',
    });
    expect(getApiErrorTrackingContext(new ApiError({ kind: 'invalid-response' }))).toEqual({
      error_category: 'api_contract',
      severity: 'P1',
    });
  });

  it('204 No Content 응답을 JSON 파싱 없이 처리할 수 있다', async () => {
    setAuthentication({ accessToken: 'member-token', tokenType: 'Bearer', expiresIn: 60 });
    server.use(http.delete(`${config.apiBaseUrl}/api/example`, () => new HttpResponse(null, { status: 204 })));

    const result = await apiRequest({
      config,
      path: '/api/example',
      method: 'DELETE',
      parseData: (value) => {
        expect(value).toBeUndefined();
        return undefined;
      },
    });

    expect(result).toBeUndefined();
  });

  it('성공 응답은 SUCCESS·message·data envelope를 모두 만족해야 한다', async () => {
    setAuthentication({ accessToken: 'member-token', tokenType: 'Bearer', expiresIn: 60 });
    server.use(
      http.get(`${config.apiBaseUrl}/api/example`, () =>
        HttpResponse.json({ code: 'OTHER', message: '형식은 비슷하지만 성공 envelope가 아님', data: {} }),
      ),
    );

    await expect(apiRequest({ config, path: '/api/example', parseData: (value) => value })).rejects.toMatchObject({
      kind: 'invalid-response',
    });
  });

  it('토큰이 없으면 요청 전에 쿠키를 담아 로그인하고 받은 토큰으로 보낸다', async () => {
    let loginCredentials: RequestCredentials | undefined;
    server.use(
      http.post(`${config.apiBaseUrl}/api/auth/login`, ({ request }) => {
        loginCredentials = request.credentials;
        return success({ accessToken: 'restored-token', tokenType: 'Bearer', expiresIn: 900, member: { memberId: 1 } });
      }),
      http.get(`${config.apiBaseUrl}/api/example`, ({ request }) => success(request.headers.get('Authorization'))),
    );

    await expect(apiRequest({ config, path: '/api/example', parseData: (value) => value })).resolves.toBe(
      'Bearer restored-token',
    );
    expect(loginCredentials).toBe('include');
  });

  it('Access Token이 만료돼 401이 오면 토큰을 갱신해 같은 요청을 한 번만 다시 보내고 화면 캐시는 남긴다', async () => {
    setAuthentication({ accessToken: 'expired-token', tokenType: 'Bearer', expiresIn: 60, memberId: 1 });
    queryClient.setQueryData(propertyQueryKeys.detail(10), { name: '보던 매물' });
    let refreshCalls = 0;
    let refreshCredentials: RequestCredentials | undefined;
    server.use(
      http.post(`${config.apiBaseUrl}/api/auth/login`, () => {
        throw new Error('토큰 만료 때는 새 회원을 만들 수 있는 로그인을 부르지 않는다.');
      }),
      http.post(`${config.apiBaseUrl}/api/auth/refresh`, ({ request }) => {
        refreshCalls += 1;
        refreshCredentials = request.credentials;
        return success({ accessToken: 'fresh-token', tokenType: 'Bearer', expiresIn: 900, member: { memberId: 1 } });
      }),
      http.get(`${config.apiBaseUrl}/api/properties/:id`, ({ request, params }) =>
        request.headers.get('Authorization') === 'Bearer fresh-token'
          ? success({ propertyId: Number(params.id) })
          : HttpResponse.json({ code: 'ACCESS_TOKEN_INVALID', message: '만료', errors: [] }, { status: 401 }),
      ),
    );

    const results = await Promise.all([
      apiRequest({ config, path: '/api/properties/10', parseData: (value) => value }),
      apiRequest({ config, path: '/api/properties/11', parseData: (value) => value }),
    ]);

    expect(results).toEqual([{ propertyId: 10 }, { propertyId: 11 }]);
    expect(refreshCalls).toBe(1);
    expect(refreshCredentials).toBe('include');
    expect(getAccessToken()).toBe('fresh-token');
    expect(queryClient.getQueryData(propertyQueryKeys.detail(10))).toEqual({ name: '보던 매물' });
  });

  it('토큰 갱신으로도 복원하지 못하면 새 회원 없이 인증과 Query Cache를 정리하고 오류 code를 보존한다', async () => {
    setAuthentication({ accessToken: 'expired-token', tokenType: 'Bearer', expiresIn: 60, memberId: 1 });
    queryClient.setQueryData(propertyQueryKeys.detail(10), { memo: '다음 회원에게 남으면 안 됨' });
    server.use(
      http.post(`${config.apiBaseUrl}/api/auth/login`, () => {
        throw new Error('갱신이 거절돼도 새 회원을 만들 수 있는 로그인을 부르지 않는다.');
      }),
      http.post(`${config.apiBaseUrl}/api/auth/refresh`, () =>
        HttpResponse.json({ code: 'REFRESH_TOKEN_INVALID', message: '내부 인증 상세', errors: [] }, { status: 401 }),
      ),
      http.get(`${config.apiBaseUrl}/api/properties/10`, () =>
        HttpResponse.json({ code: 'ACCESS_TOKEN_INVALID', message: '만료', errors: [] }, { status: 401 }),
      ),
    );

    const error = await apiRequest({ config, path: '/api/properties/10', parseData: (value) => value }).catch(
      (caught: unknown) => caught,
    );
    expect(error).toMatchObject({ status: 401, code: 'REFRESH_TOKEN_INVALID' });
    expect(getAccessToken()).toBeNull();
    expect(getAuthenticationSnapshot().terminationReason).toBe('unauthorized');
    expect(queryClient.getQueryData(propertyQueryKeys.detail(10))).toBeUndefined();
    expect(String(error)).not.toContain('내부 인증 상세');
  });

  it('메모리의 Access Token이 만료됐으면 요청 전에 로그인 대신 토큰을 갱신한다', async () => {
    setAuthentication({ accessToken: 'old-token', tokenType: 'Bearer', expiresIn: -1, memberId: 1 });
    server.use(
      http.post(`${config.apiBaseUrl}/api/auth/login`, () => {
        throw new Error('이미 회원이 정해졌으면 로그인을 부르지 않는다.');
      }),
      http.post(`${config.apiBaseUrl}/api/auth/refresh`, () =>
        success({ accessToken: 'refreshed-token', tokenType: 'Bearer', expiresIn: 900, member: { memberId: 1 } }),
      ),
      http.get(`${config.apiBaseUrl}/api/example`, ({ request }) => success(request.headers.get('Authorization'))),
    );

    await expect(apiRequest({ config, path: '/api/example', parseData: (value) => value })).resolves.toBe(
      'Bearer refreshed-token',
    );
  });

  it('통신 장애로 로그인하지 못하면 인증 상태를 바꾸지 않고 네트워크 오류로 알린다', async () => {
    server.use(http.post(`${config.apiBaseUrl}/api/auth/login`, () => HttpResponse.error()));

    await expect(apiRequest({ config, path: '/api/example', parseData: (value) => value })).rejects.toMatchObject({
      kind: 'network',
    });
    expect(getAuthenticationSnapshot()).toEqual({ session: null, terminationReason: null });
  });

  it('오류 envelope의 잘못된 errors 항목도 원문 예외로 노출하지 않고 code를 보존한다', async () => {
    setAuthentication({ accessToken: 'member-token', tokenType: 'Bearer', expiresIn: 60 });
    server.use(
      http.get(`${config.apiBaseUrl}/api/example`, () =>
        HttpResponse.json(
          { code: 'CHECKLIST_ITEM_NOT_FOUND', message: '내부 상세', errors: [null, { field: 'items' }] },
          { status: 400 },
        ),
      ),
    );

    await expect(apiRequest({ config, path: '/api/example', parseData: (value) => value })).rejects.toMatchObject({
      kind: 'server',
      status: 400,
      code: 'CHECKLIST_ITEM_NOT_FOUND',
      invalidFields: ['items'],
    });
  });

  it('인증이 끝난 뒤 도착한 보호 API 응답은 파싱하거나 캐시에 반영할 수 없게 폐기한다', async () => {
    setAuthentication({ accessToken: 'member-a-token', tokenType: 'Bearer', expiresIn: 60 });
    let releaseResponse: (() => void) | undefined;
    let markResponseStarted: (() => void) | undefined;
    const responseStarted = new Promise<void>((resolve) => {
      markResponseStarted = resolve;
    });
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    server.use(
      http.put(`${config.apiBaseUrl}/api/properties/10/memo`, async ({ request }) => {
        expect(request.headers.get('Authorization')).toBe('Bearer member-a-token');
        markResponseStarted?.();
        await responseGate;
        return HttpResponse.json({
          code: 'SUCCESS',
          message: '요청에 성공했습니다.',
          data: { content: '다른 회원에게 남으면 안 되는 메모', savedAt: '2026-08-11T07:00:00Z' },
        });
      }),
    );
    const parseData = vi.fn((value: unknown) => value);

    const request = apiRequest({
      config,
      path: '/api/properties/10/memo',
      method: 'PUT',
      body: { content: '다른 회원에게 남으면 안 되는 메모' },
      parseData,
    });
    await responseStarted;
    clearAuthentication('unauthorized');
    releaseResponse?.();

    await expect(request).rejects.toMatchObject({ kind: 'authentication-ended' });
    expect(parseData).not.toHaveBeenCalled();
  });

  it('이전 회원 요청의 늦은 401이 새 회원 인증을 종료하지 못하게 한다', async () => {
    setAuthentication({ accessToken: 'member-a-token', tokenType: 'Bearer', expiresIn: 60, memberId: 1 });
    let releaseResponse: (() => void) | undefined;
    let markResponseStarted: (() => void) | undefined;
    const responseStarted = new Promise<void>((resolve) => {
      markResponseStarted = resolve;
    });
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    server.use(
      http.get(`${config.apiBaseUrl}/api/members/me`, async () => {
        markResponseStarted?.();
        await responseGate;
        return HttpResponse.json({ code: 'ACCESS_TOKEN_INVALID', message: '만료', errors: [] }, { status: 401 });
      }),
    );

    const request = apiRequest({
      config,
      path: '/api/members/me',
      parseData: (value) => value,
    });
    await responseStarted;
    setAuthentication({ accessToken: 'member-b-token', tokenType: 'Bearer', expiresIn: 60, memberId: 2 });
    releaseResponse?.();

    await expect(request).rejects.toMatchObject({ kind: 'authentication-ended' });
    expect(getAccessToken()).toBe('member-b-token');
  });

  it('인증 종료 뒤 발생한 네트워크 실패를 재시도 가능한 요청 실패로 해석하지 않는다', async () => {
    setAuthentication({ accessToken: 'member-token', tokenType: 'Bearer', expiresIn: 60 });
    let releaseResponse: (() => void) | undefined;
    let markResponseStarted: (() => void) | undefined;
    const responseStarted = new Promise<void>((resolve) => {
      markResponseStarted = resolve;
    });
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    server.use(
      http.patch(`${config.apiBaseUrl}/api/properties/10/checklists/20/items/501/status`, async () => {
        markResponseStarted?.();
        await responseGate;
        return HttpResponse.error();
      }),
    );

    const request = apiRequest({
      config,
      path: '/api/properties/10/checklists/20/items/501/status',
      method: 'PATCH',
      body: { status: 'GOOD', expectedVersion: 0 },
      parseData: (value) => value,
    });
    await responseStarted;
    clearAuthentication('unauthorized');
    releaseResponse?.();

    await expect(request).rejects.toMatchObject({ kind: 'authentication-ended' });
  });
});

describe('초기화', () => {
  const loginResponse = (accessToken: string, memberId: number, newMember = false) =>
    success({ accessToken, tokenType: 'Bearer', expiresIn: 900, newMember, member: { memberId } });

  it('쿠키를 담아 초기화하면 새 회원 토큰으로 바꾸고 이전 회원의 화면 캐시를 지운다', async () => {
    setAuthentication({ accessToken: 'old-token', tokenType: 'Bearer', expiresIn: 900, memberId: 1 });
    queryClient.setQueryData(propertyQueryKeys.detail(10), { name: '이전 회원 매물' });
    let resetCredentials: RequestCredentials | undefined;
    server.use(
      http.post(`${config.apiBaseUrl}/api/auth/reset`, ({ request }) => {
        resetCredentials = request.credentials;
        return loginResponse('new-member-token', 2, true);
      }),
    );

    await resetAuthentication(config);

    expect(resetCredentials).toBe('include');
    expect(getAccessToken()).toBe('new-member-token');
    expect(getAuthenticationSnapshot().session?.memberId).toBe(2);
    expect(queryClient.getQueryData(propertyQueryKeys.detail(10))).toBeUndefined();
  });

  it('서버가 401로 거절해도 인증을 끝내지 않고 지금 회원과 캐시를 그대로 둔다', async () => {
    setAuthentication({ accessToken: 'old-token', tokenType: 'Bearer', expiresIn: 900, memberId: 1 });
    queryClient.setQueryData(propertyQueryKeys.detail(10), { name: '보던 매물' });
    server.use(
      http.post(`${config.apiBaseUrl}/api/auth/reset`, () =>
        HttpResponse.json({ code: 'REFRESH_TOKEN_INVALID', message: '거절', errors: [] }, { status: 401 }),
      ),
    );

    await expect(resetAuthentication(config)).rejects.toMatchObject({ kind: 'server', code: 'REFRESH_TOKEN_INVALID' });

    expect(getAuthenticationSnapshot()).toMatchObject({ terminationReason: null, session: { memberId: 1 } });
    expect(getAccessToken()).toBe('old-token');
    expect(queryClient.getQueryData(propertyQueryKeys.detail(10))).toEqual({ name: '보던 매물' });
  });

  it('진행 중인 토큰 갱신이 쿠키를 덮어쓴 뒤에 초기화를 보낸다', async () => {
    setAuthentication({ accessToken: 'expired-token', tokenType: 'Bearer', expiresIn: 900, memberId: 1 });
    const order: string[] = [];
    let releaseRefresh: (() => void) | undefined;
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });
    server.use(
      http.post(`${config.apiBaseUrl}/api/auth/refresh`, async () => {
        order.push('refresh-start');
        await refreshGate;
        order.push('refresh-end');
        return loginResponse('refreshed-token', 1);
      }),
      http.post(`${config.apiBaseUrl}/api/auth/reset`, () => {
        order.push('reset');
        return loginResponse('new-member-token', 2, true);
      }),
      http.get(`${config.apiBaseUrl}/api/example`, ({ request }) =>
        request.headers.get('Authorization') === 'Bearer expired-token'
          ? HttpResponse.json({ code: 'ACCESS_TOKEN_INVALID', message: '만료', errors: [] }, { status: 401 })
          : success(request.headers.get('Authorization')),
      ),
    );

    // 만료된 토큰으로 보낸 요청이 갱신을 시작한다.
    const expiredRequest = apiRequest({ config, path: '/api/example', parseData: (value) => value });
    await vi.waitFor(() => expect(order).toEqual(['refresh-start']));
    const reset = resetAuthentication(config);
    releaseRefresh?.();
    await reset;

    expect(order).toEqual(['refresh-start', 'refresh-end', 'reset']);
    expect(getAccessToken()).toBe('new-member-token');
    // 초기화 전에 시작한 요청은 이전 회원의 갱신 토큰으로 마친다.
    await expect(expiredRequest).resolves.toBe('Bearer refreshed-token');
  });

  it('초기화 중에 토큰이 필요해진 요청은 이전 회원 쿠키로 갱신하지 않고 초기화 응답을 기다린다', async () => {
    setAuthentication({ accessToken: 'expired-token', tokenType: 'Bearer', expiresIn: 0, memberId: 1 });
    let refreshCalls = 0;
    let releaseReset: (() => void) | undefined;
    const resetGate = new Promise<void>((resolve) => {
      releaseReset = resolve;
    });
    server.use(
      http.post(`${config.apiBaseUrl}/api/auth/refresh`, () => {
        refreshCalls += 1;
        return loginResponse('refreshed-token', 1);
      }),
      http.post(`${config.apiBaseUrl}/api/auth/reset`, async () => {
        await resetGate;
        return loginResponse('new-member-token', 2, true);
      }),
      http.get(`${config.apiBaseUrl}/api/example`, ({ request }) => success(request.headers.get('Authorization'))),
    );

    const reset = resetAuthentication(config);
    const request = apiRequest({ config, path: '/api/example', parseData: (value) => value });
    releaseReset?.();
    await reset;

    await expect(request).resolves.toBe('Bearer new-member-token');
    expect(refreshCalls).toBe(0);
  });
});
