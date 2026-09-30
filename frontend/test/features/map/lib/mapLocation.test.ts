import { describe, expect, it } from 'vitest';

import {
  clampToSouthKorea,
  coordinatesAreClose,
  isInSouthKorea,
  readLastMapCenter,
  writeLastMapCenter,
} from '@/features/map/lib/mapLocation';

describe('지도 좌표와 마지막 위치 저장', () => {
  it('대한민국 범위 안팎의 좌표를 구분한다', () => {
    expect(isInSouthKorea({ latitude: 37.5665, longitude: 126.978 })).toBe(true);
    expect(isInSouthKorea({ latitude: 40, longitude: 126.978 })).toBe(false);
  });

  it('범위를 벗어난 좌표를 대한민국 경계로 보정한다', () => {
    expect(clampToSouthKorea({ latitude: 40, longitude: 120 })).toEqual({ latitude: 38.65, longitude: 124.5 });
    expect(clampToSouthKorea({ latitude: 35, longitude: 128 })).toEqual({ latitude: 35, longitude: 128 });
  });

  it('sessionStorage에 저장한 유효한 위치만 복원한다', () => {
    const storage = window.sessionStorage;
    const center = { latitude: 37.5665, longitude: 126.978 };

    writeLastMapCenter(center, storage);

    expect(readLastMapCenter(storage)).toEqual(center);
    storage.setItem('jachwi-sunbae.lastMapCenter', JSON.stringify({ latitude: 40, longitude: 126.978 }));
    expect(readLastMapCenter(storage)).toBeNull();
  });

  it('허용 오차 안의 두 좌표를 같은 위치로 판단한다', () => {
    expect(coordinatesAreClose({ latitude: 37, longitude: 127 }, { latitude: 37.000005, longitude: 127.000005 })).toBe(
      true,
    );
    expect(coordinatesAreClose({ latitude: 37, longitude: 127 }, { latitude: 37.00002, longitude: 127 })).toBe(false);
  });
});
