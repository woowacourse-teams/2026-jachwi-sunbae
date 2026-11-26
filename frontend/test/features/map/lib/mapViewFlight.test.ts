import { describe, expect, it } from 'vitest';

import {
  FLIGHT_PAN_MS,
  FLIGHT_ZOOM_MS,
  NEAR_MOVE_MS,
  planViewFlight,
  viewFlightDuration,
} from '@/features/map/lib/mapViewFlight';

const viewport = { width: 390, height: 700 };
const plan = (distancePx: number, fromZoom = 16, toZoom = 16) =>
  planViewFlight({ from: 'from', fromZoom, to: 'to', toZoom, distancePx, viewport, minZoom: 6 });

describe('planViewFlight', () => {
  it('화면 안 거리는 한 번에 옮긴다', () => {
    expect(plan(500)).toEqual([{ center: 'to', zoom: 16, duration: NEAR_MOVE_MS }]);
    expect(plan(700)).toHaveLength(1);
  });

  it('먼 곳은 줄이고, 줄인 채 옮기고, 다시 확대한다. 한 단계에 하나만 바꾼다', () => {
    // 10km 떨어진 현재 위치: 확대 단계 16에서 약 5,300px.
    const steps = plan(5_300);
    expect(steps).toEqual([
      { center: 'from', zoom: 13, duration: FLIGHT_ZOOM_MS },
      { center: 'to', zoom: 13, duration: FLIGHT_PAN_MS },
      { center: 'to', zoom: 16, duration: FLIGHT_ZOOM_MS },
    ]);
  });

  it('줄인 단계에서 옮기는 거리는 화면 안에 든다', () => {
    for (const distance of [701, 1_500, 5_300, 40_000, 300_000]) {
      const [zoomOut] = plan(distance);
      expect(distance / 2 ** (16 - zoomOut.zoom)).toBeLessThanOrEqual(700);
    }
  });

  it('도착 단계가 더 멀리 본 단계면 그 단계까지만 줄이고 다시 확대하지 않는다', () => {
    expect(plan(800, 16, 12).map((step) => step.zoom)).toEqual([12, 12]);
  });

  it('멀리 본 채로 가까워도 확대하며 옮기면 도착 단계에서 화면 밖이므로 옮긴 뒤 확대한다', () => {
    // 확대 단계 12에서 300px은 16에서 4,800px이다.
    expect(plan(300, 12, 16)).toEqual([
      { center: 'to', zoom: 12, duration: FLIGHT_PAN_MS },
      { center: 'to', zoom: 16, duration: FLIGHT_ZOOM_MS },
    ]);
  });

  it('가장 멀리 본 단계보다 더 줄이지 않는다', () => {
    expect(Math.min(...plan(10_000_000).map((step) => step.zoom))).toBe(6);
  });

  it('거리를 모르면 예전처럼 한 번에 옮긴다', () => {
    expect(plan(Number.NaN)).toHaveLength(1);
  });

  it('걸리는 시간은 단계 시간의 합이다', () => {
    expect(viewFlightDuration(plan(5_300))).toBe(FLIGHT_ZOOM_MS * 2 + FLIGHT_PAN_MS);
  });
});
