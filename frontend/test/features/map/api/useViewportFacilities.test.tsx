import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';

import { fetchNearby } from '@/features/map/api/mapApi';
import { useViewportFacilities } from '@/features/map/api/useViewportFacilities';
import { facilityCells } from '@/features/map/lib/mapViewportQuery';
import type { NearbyPlace } from '@/features/map/model/Map';
import { PublicConfigProvider } from '@/shared/config/PublicConfigContext';

vi.mock('@/features/map/api/mapApi', () => ({ fetchNearby: vi.fn() }));

const hospital = (id: string, latitude: number, longitude: number): NearbyPlace => ({
  providerPlaceId: id,
  name: id,
  category: 'HOSPITAL',
  address: '',
  latitude,
  longitude,
  distanceMeters: 100,
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}>
    <PublicConfigProvider config={{ apiBaseUrl: 'http://localhost', commuteDataSource: 'mock' }}>
      {children}
    </PublicConfigProvider>
  </QueryClientProvider>
);

it('칸마다 고른 카테고리만 조회해 합치고, 겹치는 시설은 한 번만, 화면 밖 시설은 빼고 보여 준다', async () => {
  vi.mocked(fetchNearby).mockImplementation(async (_config, latitude, longitude, radius) => ({
    center: { latitude, longitude },
    radius,
    counts: { HOSPITAL: 3, SCHOOL: 0, CONVENIENCE: 0, AGENCY: 0 },
    // 칸마다 자기 가운데 병원과, 모든 칸이 함께 받는 화면 가운데 병원, 화면 밖 병원을 돌려준다.
    places: [
      hospital(`${latitude},${longitude}`, latitude, longitude),
      hospital('middle', 37.5, 127),
      hospital('far', 38, 127),
    ],
  }));
  const bounds = { south: 37.498, north: 37.502, west: 126.9962, east: 127.0038 };
  const cells = facilityCells(bounds);
  const { result } = renderHook(() => useViewportFacilities(cells, bounds, 'HOSPITAL'), { wrapper });
  await waitFor(() => expect(fetchNearby).toHaveBeenCalledTimes(cells.length));
  await waitFor(() => expect(result.current.places.some((place) => place.providerPlaceId === 'middle')).toBe(true));
  expect(vi.mocked(fetchNearby).mock.calls.every((call) => call[4].join() === 'HOSPITAL')).toBe(true);
  expect(result.current.places.filter((place) => place.providerPlaceId === 'middle')).toHaveLength(1);
  expect(result.current.places.some((place) => place.providerPlaceId === 'far')).toBe(false);
});

it('카테고리를 고르지 않으면 조회하지 않는다', () => {
  vi.mocked(fetchNearby).mockClear();
  const bounds = { south: 37.498, north: 37.502, west: 126.9962, east: 127.0038 };
  const { result } = renderHook(() => useViewportFacilities(facilityCells(bounds), bounds, null), { wrapper });
  expect(fetchNearby).not.toHaveBeenCalled();
  expect(result.current.places).toEqual([]);
});
