// @vitest-environment node
import { expect, it } from 'vitest';

import { markerScale } from '@/features/map/lib/mapMarkerPresentation';
import type { MapMarker } from '@/features/map/model/Map';

const marker = (overrides: Partial<MapMarker>): MapMarker => ({
  id: 'marker',
  latitude: 37.5,
  longitude: 127,
  label: '마커',
  ...overrides,
});

it('거리 메모 말풍선은 골목 배율까지 그대로 두고, 멀리 축소할수록 줄이되 너무 작아지지는 않는다', () => {
  const memo = marker({ tone: 'destination', category: 'MEMO' });
  expect(markerScale(memo, 3)).toBe(1);
  expect(markerScale(memo, 4)).toBe(1);
  expect(markerScale(memo, 6)).toBe(0.8);
  expect(markerScale(memo, 8)).toBe(0.6);
  expect(markerScale(memo, 10)).toBe(0.6);
});

it('매물 핀은 가까울수록 키우고, 고른 장소 말풍선처럼 메모가 아닌 마커는 그대로 둔다', () => {
  expect(markerScale(marker({ tone: 'property' }), 2)).toBe(1.24);
  expect(markerScale(marker({ tone: 'destination' }), 9)).toBe(1);
});
