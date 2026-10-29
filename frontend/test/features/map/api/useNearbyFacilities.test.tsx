import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';

import { fetchBusStops } from '@/features/map/api/busStopApi';
import { useNearbyFacilities } from '@/features/map/api/useNearbyFacilities';
import { PublicConfigProvider } from '@/shared/config/PublicConfigContext';

vi.mock('@/features/map/api/busStopApi', () => ({ fetchBusStops: vi.fn() }));
vi.mock('@/features/map/api/mapApi', () => ({ fetchNearby: vi.fn() }));

const stop = (nodeId: string, latitude: number) => ({
  nodeId,
  name: nodeId,
  latitude,
  longitude: 127,
  distanceMeters: 100,
});

it('지도를 옮겨 새 범위를 받는 동안에도 이전 정류장을 그대로 보여 준다', async () => {
  let resolveNext: (value: Awaited<ReturnType<typeof fetchBusStops>>) => void = () => undefined;
  vi.mocked(fetchBusStops)
    .mockResolvedValueOnce({
      center: { latitude: 37, longitude: 127 },
      radius: 500,
      count: 1,
      busStops: [stop('first', 37)],
    })
    .mockImplementationOnce(() => new Promise((resolve) => (resolveNext = resolve)));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <PublicConfigProvider config={{ apiBaseUrl: 'http://localhost', commuteDataSource: 'mock' }}>
        {children}
      </PublicConfigProvider>
    </QueryClientProvider>
  );
  const { result, rerender } = renderHook(
    ({ latitude }) => useNearbyFacilities({ latitude, longitude: 127 }, 500, ['TRANSPORT']),
    { wrapper, initialProps: { latitude: 37 } },
  );
  await waitFor(() => expect(result.current.data.places.map((place) => place.providerPlaceId)).toEqual(['first']));

  rerender({ latitude: 37.001 });
  expect(result.current.data.places.map((place) => place.providerPlaceId)).toEqual(['first']);

  resolveNext({
    center: { latitude: 37.001, longitude: 127 },
    radius: 500,
    count: 1,
    busStops: [stop('second', 37.001)],
  });
  await waitFor(() => expect(result.current.data.places.map((place) => place.providerPlaceId)).toEqual(['second']));
});
