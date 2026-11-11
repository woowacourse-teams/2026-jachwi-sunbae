import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import AppRoutes from '@/app/router/AppRoutes';
import AdminPage from '@/pages/admin/AdminPage';
import { getAccessToken } from '@/features/auth/model/authStore';
import { PublicConfigProvider } from '@/shared/config/PublicConfigContext';

import { server } from '../../server';

const baseUrl = 'http://localhost:8080';
const summary = { activeAccounts: 1234, newAccountsToday: 12, activeProperties: 567 };
const members = [{ memberId: 321, createdAt: '2026-11-10T16:10:00Z', activeProperties: 3, activePhotos: 7 }];
const success = (data: unknown) => HttpResponse.json({ code: 'SUCCESS', message: '성공', data });
const denied = () =>
  HttpResponse.json({ code: 'ADMIN_ACCESS_DENIED', message: '인증 필요', errors: [] }, { status: 401 });
const renderPage = (route = false) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <PublicConfigProvider config={{ apiBaseUrl: baseUrl }}>
        <MemoryRouter initialEntries={['/admin']}>{route ? <AppRoutes /> : <AdminPage />}</MemoryRouter>
      </PublicConfigProvider>
    </QueryClientProvider>,
  );
const handlers = () =>
  server.use(
    http.get(`${baseUrl}/api/admin/summary`, () => success(summary)),
    http.get(`${baseUrl}/api/admin/members`, () => success(members)),
  );
const login = async (user: ReturnType<typeof userEvent.setup>, code = 'test-only-code') => {
  await user.type(await screen.findByLabelText('접속 코드'), code);
  await user.click(screen.getByRole('button', { name: '접속하기' }));
};

describe('운영 관리자', () => {
  it('관리자 첫 진입은 회원 생성과 세션 확인 요청 없이 접속 화면을 연다', async () => {
    const memberLogin = vi.fn(() => denied());
    const session = vi.fn(() => denied());
    server.use(http.post(`${baseUrl}/api/auth/login`, memberLogin), http.get(`${baseUrl}/api/admin/session`, session));
    renderPage(true);
    expect(await screen.findByRole('heading', { name: '관리자 접속' })).toBeInTheDocument();
    expect(memberLogin).not.toHaveBeenCalled();
    expect(session).not.toHaveBeenCalled();
    expect(getAccessToken()).toBeNull();
  });

  it('코드를 Authorization 헤더로 보내고 통계와 최근 회원을 표시한다', async () => {
    const user = userEvent.setup();
    handlers();
    const requests: Request[] = [];
    server.use(
      http.get(`${baseUrl}/api/admin/summary`, ({ request }) => {
        requests.push(request);
        return success(summary);
      }),
      http.get(`${baseUrl}/api/admin/members`, ({ request }) => {
        requests.push(request);
        return success(members);
      }),
    );
    renderPage();
    await login(user);
    expect(await screen.findByText('1,234')).toBeInTheDocument();
    expect(await screen.findByRole('rowheader', { name: '321' })).toBeInTheDocument();
    expect(screen.getByText('2026. 11. 11. 오전 1:10:00')).toBeInTheDocument();
    expect(screen.getByText(/실제 사람 수와 다릅니다/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /CloudWatch/ })).toHaveAttribute('rel', 'noopener noreferrer');
    expect(requests).toHaveLength(2);
    for (const request of requests) {
      expect(request.headers.get('Authorization')).toBe('Admin test-only-code');
      expect(request.headers.get('X-Admin-Request')).toBeNull();
      expect(request.headers.get('X-Admin-CSRF')).toBeNull();
      expect(request.credentials).not.toBe('include');
      expect(new URL(request.url).search).toBe('');
      expect(request.body).toBeNull();
    }
    expect(screen.queryByRole('button', { name: '검색' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: '회원 목록 페이지' })).not.toBeInTheDocument();
  });

  it('잘못된 코드 안내 후 대기 제한 없이 다시 접속한다', async () => {
    const user = userEvent.setup();
    handlers();
    server.use(
      http.get(`${baseUrl}/api/admin/summary`, ({ request }) =>
        request.headers.get('Authorization') === 'Admin correct' ? success(summary) : denied(),
      ),
    );
    renderPage();
    await login(user, 'incorrect');
    expect(await screen.findByRole('alert')).toHaveTextContent('접속 코드를 확인해 주세요.');
    expect(screen.getByLabelText('접속 코드')).toHaveValue('');
    await login(user, 'correct');
    expect(await screen.findByText('1,234')).toBeInTheDocument();
  });

  it('빈 회원 목록을 처리하고 조회 실패 시 다시 시도한다', async () => {
    const user = userEvent.setup();
    handlers();
    const handler = vi.fn(() => new HttpResponse(null, { status: 500 }));
    server.use(http.get(`${baseUrl}/api/admin/members`, handler));
    renderPage();
    await login(user);
    expect(await screen.findByText('회원 목록을 불러오지 못했습니다.')).toBeInTheDocument();
    server.use(http.get(`${baseUrl}/api/admin/members`, () => success([])));
    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByText('조회된 회원이 없습니다.')).toBeInTheDocument();
  });

  it('조회가 401이면 회원 생성 없이 접속 화면으로 돌아간다', async () => {
    const user = userEvent.setup();
    handlers();
    server.use(http.get(`${baseUrl}/api/admin/members`, () => denied()));
    renderPage();
    await login(user);
    expect(await screen.findByRole('heading', { name: '관리자 접속' })).toBeInTheDocument();
    expect(getAccessToken()).toBeNull();
  });

  it('로그아웃은 서버 요청 없이 코드를 지우고 다시 열어도 접속 화면을 표시한다', async () => {
    const user = userEvent.setup();
    handlers();
    const logout = vi.fn(() => new HttpResponse(null, { status: 204 }));
    server.use(http.delete(`${baseUrl}/api/admin/session`, logout));
    const view = renderPage();
    await login(user);
    await user.click(await screen.findByRole('button', { name: '관리자 로그아웃' }));
    expect(await screen.findByRole('heading', { name: '관리자 접속' })).toBeInTheDocument();
    expect(screen.queryByText('1,234')).not.toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();
    view.unmount();
    renderPage();
    expect(await screen.findByRole('heading', { name: '관리자 접속' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('rowheader', { name: '321' })).not.toBeInTheDocument());
  });
});
