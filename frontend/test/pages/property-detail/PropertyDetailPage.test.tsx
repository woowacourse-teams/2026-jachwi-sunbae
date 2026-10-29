import { QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, expect, it } from 'vitest';

import { propertyChecklistHandlers } from '@/app/mocks/handlers/propertyChecklistHandlers';
import { propertyHandlers } from '@/app/mocks/handlers/propertyHandlers';
import PropertyDetailPage from '@/pages/property-detail/PropertyDetailPage';
import { resetAuthenticationForTests, setAuthentication } from '@/features/auth/model/authStore';
import { queryClient } from '@/shared/api/queryClient';
import { PublicConfigProvider } from '@/shared/config/PublicConfigContext';

import { server } from '../../server';

beforeEach(() => {
  setAuthentication({ accessToken: 'valid-token', tokenType: 'Bearer', expiresIn: 60 });
  server.use(...propertyHandlers, ...propertyChecklistHandlers);
});
afterEach(() => {
  resetAuthenticationForTests();
  queryClient.clear();
  sessionStorage.clear();
});

const renderDetail = (search = '') => {
  const router = createMemoryRouter([{ path: '/properties/:propertyId', element: <PropertyDetailPage /> }], {
    initialEntries: [{ pathname: '/properties/10', search, state: { returnTo: '/properties' } }],
  });
  render(
    <QueryClientProvider client={queryClient}>
      <PublicConfigProvider config={{ apiBaseUrl: 'http://localhost:8080' }}>
        <RouterProvider router={router} />
      </PublicConfigProvider>
    </QueryClientProvider>,
  );
  return router;
};

it('주소에 체크리스트 탭이 있으면 체크리스트 탭으로 연다', async () => {
  renderDetail('?tab=checklist');
  expect(await screen.findByRole('tab', { name: '체크리스트' })).toHaveAttribute('aria-selected', 'true');
});

it('고른 탭을 들어온 화면 정보와 함께 주소에 남긴다', async () => {
  const user = userEvent.setup();
  const router = renderDetail();
  await user.click(await screen.findByRole('tab', { name: '체크리스트' }));

  expect(router.state.location.search).toBe('?tab=checklist');
  expect(router.state.location.state).toEqual({ returnTo: '/properties' });
  expect(router.state.historyAction).toBe('REPLACE');

  await user.click(screen.getByRole('tab', { name: '정보' }));
  expect(router.state.location.search).toBe('?tab=details');
});

it('주소에 탭이 없으면 마지막으로 본 탭으로 연다', async () => {
  const user = userEvent.setup();
  renderDetail();
  await user.click(await screen.findByRole('tab', { name: '체크리스트' }));
  cleanup();

  renderDetail();
  expect(await screen.findByRole('tab', { name: '체크리스트' })).toHaveAttribute('aria-selected', 'true');
});

it('탭 제목에 매물 이름과 지금 탭을 담는다', async () => {
  renderDetail('?tab=checklist');
  await screen.findByRole('tab', { name: '체크리스트' });
  await waitFor(() => expect(document.title).toBe('신림역 원룸 체크리스트 | 자취선배'));
});

it('항목을 평가해도 포커스가 누른 버튼에 남고, 바뀐 평가 개수를 알린다', async () => {
  const user = userEvent.setup();
  renderDetail('?tab=checklist');
  const group = await screen.findByRole('group', { name: '주차가 가능한가요?' });
  const good = within(group).getByRole('button', { name: '괜찮음' });

  await user.click(good);

  await waitFor(() => expect(good).toHaveAttribute('aria-pressed', 'true'));
  expect(good).toHaveFocus();
  expect(screen.getByRole('status')).toHaveTextContent('3개 중 3개 평가');
});

it('메모를 저장하면 포커스를 그 항목의 메모 버튼으로 돌린다', async () => {
  const user = userEvent.setup();
  renderDetail('?tab=checklist');
  await user.click(await screen.findByRole('button', { name: '주차가 가능한가요? 메모 추가' }));
  await user.type(screen.getByRole('textbox', { name: '주차가 가능한가요? 메모' }), '기계식 주차 1대');
  await user.click(screen.getByRole('button', { name: '저장' }));

  expect(await screen.findByRole('button', { name: '주차가 가능한가요? 메모 편집' })).toHaveFocus();
});

it('정보 탭의 값 버튼은 라벨과 화면에 보이는 값을 함께 읽는다', async () => {
  renderDetail('?tab=info');
  expect(await screen.findByRole('button', { name: '매물 이름 신림역 원룸, 수정' })).toBeInTheDocument();
});
