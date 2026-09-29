import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import useMapLocation from '@/pages/map/hooks/useMapLocation';
import { readLastMapCenter, requestCurrentMapLocation } from '@/features/map/lib/mapLocation';

vi.mock('@/features/map/lib/mapLocation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/map/lib/mapLocation')>()),
  readLastMapCenter: vi.fn(() => null),
  requestCurrentMapLocation: vi.fn(),
  readGeolocationPermission: vi.fn(async () => 'denied'),
}));

describe('지도 위치 이동', () => {
  it('현재 위치 요청 도중 대체 매물이 바뀌면 실패 시점의 좌표를 사용한다', async () => {
    vi.mocked(readLastMapCenter).mockReturnValue(null);
    let rejectLocation: (reason: Error) => void = () => undefined;
    vi.mocked(requestCurrentMapLocation).mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectLocation = reject;
        }),
    );
    let fallback = { latitude: 37, longitude: 127, label: '이전 매물' };
    const { result } = renderHook(() => useMapLocation());
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.moveToCurrentLocation(() => fallback);
    });
    fallback = { latitude: 38, longitude: 128, label: '새 매물' };
    await act(async () => {
      rejectLocation(new Error('위치 실패'));
      await pending;
    });
    expect(result.current.viewportCenter).toEqual({ latitude: 38, longitude: 128 });
    expect(result.current.locationLabel).toBe('새 매물');
    expect(result.current.locationStatus).toBe('fallback');
  });

  it('클러스터 좌표로 이동해도 실제 현재 위치 표시는 바뀌지 않는다', () => {
    const { result } = renderHook(() => useMapLocation());
    act(() => result.current.moveToCoordinate({ latitude: 36, longitude: 126 }));
    expect(result.current.viewportCenter).toEqual({ latitude: 36, longitude: 126 });
    expect(result.current.currentPosition).toBeNull();
  });
});
