import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it } from 'vitest';

import { propertyHandlers } from '@/app/mocks/handlers/propertyHandlers';
import { getMockProperties } from '@/app/mocks/mockStore';
import PropertyPhotosPage from '@/pages/property-photos/PropertyPhotosPage';
import { resetAuthenticationForTests, setAuthentication } from '@/features/auth/model/authStore';
import { FROM_PROPERTY_DETAIL_STATE } from '@/features/property/lib/propertyNavigation';
import { queryClient } from '@/shared/api/queryClient';
import { PublicConfigProvider } from '@/shared/config/PublicConfigContext';

import { server } from '../../server';

beforeEach(() => {
  setAuthentication({ accessToken: 'valid-token', tokenType: 'Bearer', expiresIn: 60 });
  server.use(...propertyHandlers);
});
afterEach(() => {
  resetAuthenticationForTests();
  queryClient.clear();
});

/** 상세 자리. 들어온 곳(state)을 그대로 보여 주고, 사진 관리로 넘어가는 링크를 둔다. */
const DetailRoute = () => {
  const location = useLocation();
  return (
    <>
      <h1>매물 상세</h1>
      <output aria-label="상세 상태">{JSON.stringify(location.state)}</output>
      <Link to={`${location.pathname}/photos`} state={FROM_PROPERTY_DETAIL_STATE}>
        사진 관리
      </Link>
    </>
  );
};

const renderFrom = (initialEntries: Parameters<typeof MemoryRouter>[0]['initialEntries']) =>
  render(
    <QueryClientProvider client={queryClient}>
      <PublicConfigProvider config={{ apiBaseUrl: 'http://localhost:8080' }}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/properties/:propertyId" element={<DetailRoute />} />
            <Route path="/properties/:propertyId/photos" element={<PropertyPhotosPage />} />
          </Routes>
        </MemoryRouter>
      </PublicConfigProvider>
    </QueryClientProvider>,
  );

it('상세에서 들어온 사진 화면의 뒤로가기는 새로 이동하지 않고 들어온 곳을 기억한 상세로 돌아간다', async () => {
  const user = userEvent.setup();
  const [property] = getMockProperties();
  renderFrom([{ pathname: `/properties/${property.id}`, state: { returnTo: '/properties' } }]);
  await user.click(screen.getByRole('link', { name: '사진 관리' }));
  await user.click(await screen.findByRole('button', { name: '매물 상세로 돌아가기' }));
  expect(screen.getByRole('heading', { name: '매물 상세' })).toBeInTheDocument();
  // 상세가 받았던 들어온 곳(본 방 기록)을 그대로 가진다. 홈으로 새로 이동하지 않는다.
  expect(screen.getByLabelText('상세 상태')).toHaveTextContent('{"returnTo":"/properties"}');
});

it('주소로 바로 연 사진 화면의 뒤로가기는 그 매물 상세로 간다', async () => {
  const user = userEvent.setup();
  const [property] = getMockProperties();
  renderFrom([`/properties/${property.id}/photos`]);
  await user.click(await screen.findByRole('button', { name: '매물 상세로 돌아가기' }));
  expect(screen.getByRole('heading', { name: '매물 상세' })).toBeInTheDocument();
});
