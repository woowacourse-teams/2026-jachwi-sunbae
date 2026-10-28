import { afterEach, expect, it, vi } from 'vitest';

import {
  readNeighborhoodSearch,
  writeNeighborhoodSearch,
} from '@/pages/neighborhood-preview/model/neighborhoodSearchSession';

const value = {
  destination: { latitude: 37.4, longitude: 127.1, name: '목적지', address: '주소' },
  maxMinutes: 60,
  maxTransfers: 2,
  maxRent: 50,
  selectedId: '11230640',
  selectedStopId: 'test-stop',
};
afterEach(() => vi.useRealTimers());
it('경계 데이터 대신 검색 조건과 선택 코드만 저장하고 복원한다', () => {
  writeNeighborhoodSearch('test-search', value);
  expect(readNeighborhoodSearch('test-search')).toEqual(value);
  expect(sessionStorage.getItem('test-search')).not.toContain('polygons');
  writeNeighborhoodSearch('test-search', null);
  expect(readNeighborhoodSearch('test-search')).toBeNull();
});
it('오래되거나 손상된 복원 정보는 무시한다', () => {
  vi.useFakeTimers();
  writeNeighborhoodSearch('test-search', value);
  vi.advanceTimersByTime(30 * 60 * 1000);
  expect(readNeighborhoodSearch('test-search')).toBeNull();
  sessionStorage.setItem('test-search', '{}');
  expect(readNeighborhoodSearch('test-search')).toBeNull();
});
it('월세 조건이 없던 때 저장한 검색은 전체 가격으로 복원한다', () => {
  const legacy = {
    destination: value.destination,
    maxMinutes: value.maxMinutes,
    maxTransfers: value.maxTransfers,
    selectedId: value.selectedId,
    selectedStopId: value.selectedStopId,
  };
  sessionStorage.setItem('test-search', JSON.stringify({ ...legacy, savedAt: Date.now() }));
  expect(readNeighborhoodSearch('test-search')).toEqual({ ...legacy, maxRent: 0 });
});
