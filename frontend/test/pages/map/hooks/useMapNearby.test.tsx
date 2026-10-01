import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';

import useMapNearby from '@/pages/map/hooks/useMapNearby';
import { fetchNearby } from '@/features/map/api/mapApi';
import type { MapCoordinate } from '@/features/map/lib/mapLocation';
import { PublicConfigProvider } from '@/shared/config/PublicConfigContext';

vi.mock('@/features/map/api/mapApi', () => ({ fetchNearby: vi.fn() }));

it('GPS가 없으면 원과 반경 조회를 생략하고, GPS를 얻은 뒤에는 화면을 움직여도 기준을 유지한다', async () => {
  vi.mocked(fetchNearby).mockResolvedValue({
    center: { latitude: 37.5, longitude: 127 },
    radius: 500,
    counts: { HOSPITAL: 0, TRANSPORT: 0, SCHOOL: 0, CONVENIENCE: 0, AGENCY: 0 },
    places: [],
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PublicConfigProvider config={{ apiBaseUrl: '/api', mapProviderMode: 'demo' }}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </PublicConfigProvider>
  );
  const { result, rerender, unmount } = renderHook(
    ({ viewport, gps }: { viewport: MapCoordinate; gps: MapCoordinate | null }) =>
      useMapNearby(viewport, 4, [], 500, gps),
    { wrapper, initialProps: { viewport: { latitude: 37.4, longitude: 127.1 }, gps: null as MapCoordinate | null } },
  );
  expect(result.current.circles).toEqual([]);
  expect(fetchNearby).not.toHaveBeenCalled();
  const gps = { latitude: 37.5, longitude: 127 };
  rerender({ viewport: gps, gps });
  await waitFor(() => expect(result.current.nearby.isSuccess).toBe(true));
  expect(result.current.circles).toEqual([{ radiusMeters: 500, label: '500m' }]);
  rerender({ viewport: { latitude: 37.6, longitude: 127.2 }, gps });
  expect(fetchNearby).toHaveBeenCalledTimes(1);
  expect(fetchNearby).toHaveBeenCalledWith(
    expect.anything(),
    37.5,
    127,
    500,
    expect.any(Array),
    expect.any(AbortSignal),
  );
  unmount();
  client.clear();
});
