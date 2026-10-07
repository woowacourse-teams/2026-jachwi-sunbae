import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';

import { propertySummaryFixture } from '@/app/mocks/fixtures/propertyFixtures';
import MapPage from '@/pages/map/MapPage';
import { setAuthentication } from '@/features/auth/model/authStore';
import { getMapFocusCenter } from '@/features/map/lib/mapViewportFocus';
import type MapCanvas from '@/features/map/ui/map-canvas/MapCanvas';
import { PublicConfigProvider } from '@/shared/config/PublicConfigContext';

import { server } from '../../server';

vi.mock('@/features/map/ui/map-canvas/MapCanvas', () => ({
  default: (props: React.ComponentProps<typeof MapCanvas>) => (
    <div>
      <output aria-label="조회 기준">{JSON.stringify(props.radiusCenter)}</output>
      <output aria-label="지도 확대 수준">{props.level}</output>
      <output aria-label="지도 중심">{JSON.stringify(props.center)}</output>
      <button onClick={() => props.onCenterChange?.(37.5, 127.1)}>지도 이동</button>
      {props.markers
        ?.filter((marker) => marker.tone === 'property')
        .map((marker) => (
          <button key={marker.id} onClick={() => props.onSelectMarker?.(marker)}>
            매물 선택
          </button>
        ))}
    </div>
  ),
}));

it('최초 반경 선택은 막고 활성화 후에는 반경에 맞춰 확대 수준만 변경한다', async () => {
  server.use(
    http.get('*/api/properties', () => HttpResponse.json({ code: 'SUCCESS', data: { totalCount: 0, items: [] } })),
    http.get('*/api/maps/nearby', () => HttpResponse.json({ code: 'SUCCESS', data: { counts: {}, places: [] } })),
  );
  const user = userEvent.setup();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PublicConfigProvider config={{ apiBaseUrl: 'http://localhost:8080', mapProviderMode: 'demo' }}>
          <MapPage />
        </PublicConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  const initialAnchor = screen.getByLabelText('조회 기준').textContent;
  const initialLevel = screen.getByLabelText('지도 확대 수준').textContent;
  expect(screen.getByRole('button', { name: '500m' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '1km' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '2km' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: '지도 이동' }));
  await user.click(screen.getByRole('button', { name: '500m' }));
  await user.click(screen.getByRole('button', { name: '2km' }));
  expect(screen.getByLabelText('조회 기준')).toHaveTextContent(initialAnchor!);
  expect(screen.getByLabelText('지도 확대 수준')).toHaveTextContent(initialLevel!);
  await user.click(screen.getByRole('button', { name: '지도에서 매물 추가' }));
  expect(screen.queryByText('중앙 핀 기준으로 주변 시설을 확인해 보세요.')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '500m' })).toBeEnabled();
  expect(screen.getByLabelText('조회 기준')).toHaveTextContent(JSON.stringify({ latitude: 37.5, longitude: 127.1 }));
  await user.click(screen.getByRole('button', { name: '1km' }));
  expect(screen.getByLabelText('지도 확대 수준')).toHaveTextContent('6');
  await user.click(screen.getByRole('button', { name: '2km' }));
  expect(screen.getByLabelText('지도 확대 수준')).toHaveTextContent('7');
  await user.click(screen.getByRole('button', { name: '500m' }));
  expect(screen.getByLabelText('지도 확대 수준')).toHaveTextContent('5');
  expect(screen.getByLabelText('조회 기준')).toHaveTextContent(JSON.stringify({ latitude: 37.5, longitude: 127.1 }));
  await user.click(screen.getByRole('button', { name: '500m' }));
  expect(screen.getByLabelText('지도 확대 수준')).toHaveTextContent('5');
  await user.click(screen.getByRole('button', { name: '지도 이동' }));
  client.clear();
});

it('선택 매물의 반경을 바꾸면 새 확대 수준에서 매물을 기준으로 지도 중심도 이동한다', async () => {
  setAuthentication({ accessToken: 'demo-token', tokenType: 'Bearer', expiresIn: 60 });
  const coordinate = { latitude: 37.5, longitude: 127.1 };
  server.use(
    http.get('*/api/properties', () =>
      HttpResponse.json({
        code: 'SUCCESS',
        message: '요청에 성공했습니다.',
        data: {
          totalCount: 1,
          items: [
            {
              ...propertySummaryFixture,
              id: propertySummaryFixture.propertyId,
              ...coordinate,
              address: '테스트 주소',
              discoverySource: '데모 지도',
              overallProgress: propertySummaryFixture.progress,
              stages: [],
              photoCount: 0,
              representativePhoto: null,
              location: { ...coordinate, address: '테스트 주소' },
            },
          ],
        },
      }),
    ),
    http.get('*/api/maps/nearby', () => HttpResponse.json({ code: 'SUCCESS', data: { counts: {}, places: [] } })),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PublicConfigProvider config={{ apiBaseUrl: 'http://localhost:8080', mapProviderMode: 'demo' }}>
          <MapPage />
        </PublicConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await user.click(screen.getByRole('button', { name: '지도 이동' }));
  await user.click(await screen.findByRole('button', { name: '매물 선택' }));
  await user.click(screen.getByRole('button', { name: '지도 이동' }));
  await user.click(screen.getByRole('button', { name: '2km' }));
  expect(screen.getByLabelText('지도 중심')).toHaveTextContent(
    JSON.stringify(getMapFocusCenter(coordinate, 7, 390, 640)),
  );
  expect(screen.getByLabelText('조회 기준')).toHaveTextContent(JSON.stringify(coordinate));
  await user.click(screen.getByRole('button', { name: '500m' }));
  expect(screen.getByLabelText('지도 중심')).toHaveTextContent(
    JSON.stringify(getMapFocusCenter(coordinate, 5, 390, 640)),
  );
  client.clear();
});
