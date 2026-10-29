import { afterEach, expect, it, vi } from 'vitest';

import { readCommuteDestination, writeCommuteDestination } from '@/features/map/lib/commuteDestinationStore';

const STORAGE_KEY = 'jachwi-sunbae:commute-destination';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

it('출퇴근 장소의 좌표와 이름만 기억했다가 읽는다', () => {
  writeCommuteDestination({ latitude: 37.3947, longitude: 127.1112, name: '판교역' });
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual({
    latitude: 37.3947,
    longitude: 127.1112,
    name: '판교역',
  });
  expect(readCommuteDestination()).toEqual({ latitude: 37.3947, longitude: 127.1112, name: '판교역' });
});

it('저장한 적 없거나 깨진 값이면 장소가 없는 것으로 본다', () => {
  expect(readCommuteDestination()).toBeNull();
  localStorage.setItem(STORAGE_KEY, '{');
  expect(readCommuteDestination()).toBeNull();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ latitude: 120, longitude: 127, name: '판교역' }));
  expect(readCommuteDestination()).toBeNull();
});

it('저장소를 막아 둔 브라우저에서도 오류 없이 넘어간다', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  expect(() => writeCommuteDestination({ latitude: 37.39, longitude: 127.11, name: '판교역' })).not.toThrow();
});
