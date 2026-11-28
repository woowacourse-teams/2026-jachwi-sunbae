import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FLIGHT_PAN_MS, FLIGHT_ZOOM_MS, NEAR_MOVE_MS } from '@/features/map/lib/mapViewFlight';
import { naverEngine } from '@/features/map/lib/naverMapEngine';

type Coord = { lat: () => number; lng: () => number };
const coord = (latitude: number, longitude: number): Coord => ({ lat: () => latitude, lng: () => longitude });

// 화면 거리는 위도 차이 0.001마다 100px로 둔다(확대 단계 16 기준).
const fakeMap = () => {
  const map = {
    getCenter: vi.fn(() => coord(37.48, 126.95)),
    getZoom: vi.fn(() => 16),
    getSize: () => ({ width: 390, height: 700 }),
    getProjection: () => ({
      fromOffsetToCoord: () => coord(0, 0),
      fromCoordToOffset: (target: Coord) => ({ x: 0, y: target.lat() * 100_000 }),
    }),
    morph: vi.fn(),
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    destroy: vi.fn(),
  };
  return { map };
};

describe('naverEngine.animateView', () => {
  const listeners = new Map<string, () => void>();
  beforeEach(() => {
    vi.useFakeTimers();
    listeners.clear();
    const fakeNaver = {
      maps: {
        Event: {
          addListener: (_target: object, name: string, callback: () => void) => {
            listeners.set(name, callback);
            return name;
          },
          removeListener: (name: string) => listeners.delete(name),
        },
      },
    };
    window.naver = fakeNaver as unknown as Window['naver'];
  });
  afterEach(() => {
    vi.useRealTimers();
    delete window.naver;
  });

  const engine = naverEngine('test');
  // 앱 단계 4는 네이버 확대 단계 16이다.
  const LEVEL = 4;

  it('가까운 곳은 morph 한 번으로 부드럽게 옮긴다', () => {
    const { map } = fakeMap();
    const duration = engine.animateView(map as never, coord(37.483, 126.95) as never, LEVEL);
    expect(map.morph).toHaveBeenCalledTimes(1);
    expect(map.morph.mock.calls[0]?.[1]).toBe(16);
    expect(map.setCenter).not.toHaveBeenCalled();
    expect(duration).toBe(NEAR_MOVE_MS);
  });

  it('먼 곳(현재 위치 버튼으로 10km)은 순간 이동하지 않고 줄였다가 옮기고 다시 확대한다', () => {
    const { map } = fakeMap();
    const target = coord(37.533, 126.95);
    const duration = engine.animateView(map as never, target as never, LEVEL);
    expect(map.setCenter).not.toHaveBeenCalled();
    expect(map.morph).toHaveBeenCalledTimes(1);
    expect(map.morph.mock.calls[0]?.[1]).toBeLessThan(16);
    vi.advanceTimersByTime(FLIGHT_ZOOM_MS);
    expect(map.morph).toHaveBeenCalledTimes(2);
    expect(map.morph.mock.calls[1]?.[0]).toBe(target);
    vi.advanceTimersByTime(FLIGHT_PAN_MS);
    expect(map.morph).toHaveBeenCalledTimes(3);
    expect(map.morph.mock.calls[2]?.[0]).toBe(target);
    expect(map.morph.mock.calls[2]?.[1]).toBe(16);
    expect(duration).toBe(FLIGHT_ZOOM_MS * 2 + FLIGHT_PAN_MS);
    expect(listeners.size).toBe(0);
  });

  it('옮기는 도중 손으로 끌면 남은 단계를 하지 않는다', () => {
    const { map } = fakeMap();
    engine.animateView(map as never, coord(37.533, 126.95) as never, LEVEL);
    listeners.get('dragstart')?.();
    vi.advanceTimersByTime(2_000);
    expect(map.morph).toHaveBeenCalledTimes(1);
  });

  it('옮기는 도중 다른 곳으로 옮기라고 하면 앞의 남은 단계는 버린다', () => {
    const { map } = fakeMap();
    engine.animateView(map as never, coord(37.533, 126.95) as never, LEVEL);
    const next = coord(37.481, 126.95);
    engine.animateView(map as never, next as never, LEVEL);
    vi.advanceTimersByTime(2_000);
    expect(map.morph).toHaveBeenCalledTimes(2);
    expect(map.morph.mock.calls[1]?.[0]).toBe(next);
  });
});
