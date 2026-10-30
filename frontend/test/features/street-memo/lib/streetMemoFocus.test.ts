import { describe, expect, it } from 'vitest';

import {
  CLOSEST_LEVEL,
  focusOnMemos,
  OVERLAP_HEIGHT_RATIO,
  SINGLE_MEMO_LEVEL,
} from '@/features/street-memo/lib/streetMemoFocus';

/** 위도 0.1도, 경도 0.1도를 보는 화면. 겹침 간격은 위도 0.003도, 경도 0.006도다. */
const bounds = { south: 37.3, north: 37.4, west: 127.0, east: 127.1 };

describe('누른 거리 메모로 다가가기', () => {
  it('메모 하나는 그 메모를 가운데 두고 골목이 보이는 배율까지 다가간다', () => {
    expect(focusOnMemos([{ latitude: 37.35, longitude: 127.05 }], bounds, 9)).toEqual({
      center: { latitude: 37.35, longitude: 127.05 },
      level: SINGLE_MEMO_LEVEL,
    });
  });

  it('이미 더 가까이 보고 있으면 메모 하나를 눌러도 멀어지지 않는다', () => {
    expect(focusOnMemos([{ latitude: 37.35, longitude: 127.05 }], bounds, 2).level).toBe(2);
  });

  it('겹쳐 묶인 메모는 가운데로 옮기고 말풍선이 갈라질 만큼 확대하되 너무 바짝 붙지는 않는다', () => {
    // 위도로 겹침 간격의 1/5만큼 떨어진 두 메모: 세 단계 확대하면 간격(1/8)보다 멀어진다.
    const gap = (bounds.north - bounds.south) * OVERLAP_HEIGHT_RATIO;
    const memos = [
      { latitude: 37.35, longitude: 127.05 },
      { latitude: 37.35 + gap / 5, longitude: 127.05 },
    ];
    const focus = focusOnMemos(memos, bounds, 7);
    expect(focus.center.latitude).toBeCloseTo(37.35 + gap / 10);
    expect(focus.level).toBe(4);
    expect(focusOnMemos(memos, bounds, 9).level).toBe(SINGLE_MEMO_LEVEL);
    expect(focusOnMemos(memos, bounds, 5).level).toBe(CLOSEST_LEVEL);
    // 이미 그보다 가까이 보고 있으면 멀어지지 않는다.
    expect(focusOnMemos(memos, bounds, 2).level).toBe(2);
  });

  it('좌표가 같아 갈라질 수 없는 메모 묶음은 가장 가까운 배율에서 멈춘다', () => {
    const same = { latitude: 37.35, longitude: 127.05 };
    expect(focusOnMemos([same, same], bounds, 8).level).toBe(CLOSEST_LEVEL);
  });
});
