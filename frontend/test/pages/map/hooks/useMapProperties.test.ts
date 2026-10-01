import { renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import useMapProperties from '@/pages/map/hooks/useMapProperties';

const state = vi.hoisted(() => ({
  items: [
    {
      propertyId: 1,
      name: '이전 매물',
      depositAmount: 0,
      monthlyRentAmount: 0,
      location: { latitude: 37, longitude: 127 },
    },
  ],
}));
vi.mock('@/features/property/api/useProperties', () => ({
  usePropertyList: () => ({ data: { pages: [{ content: state.items }] } }),
}));
vi.mock('@/features/property/api/usePropertyPhotoObjectUrls', () => ({ usePropertyPhotoObjectUrls: () => ({}) }));
vi.mock('@/features/map/lib/mapClustering', () => ({ clusterProperties: () => [] }));

it('이전에 받은 대체 좌표 함수도 새 조회 결과와 빈 목록을 반영한다', () => {
  const { result, rerender } = renderHook(() => useMapProperties({ latitude: 37, longitude: 127 }, 4));
  const readFallback = result.current.getFallbackCoordinate;
  state.items = [{ ...state.items[0]!, name: '새 매물', location: { latitude: 38, longitude: 128 } }];
  rerender();
  expect(readFallback()).toEqual({ latitude: 38, longitude: 128, label: '새 매물' });
  state.items = [];
  rerender();
  expect(readFallback()).toBeUndefined();
});
