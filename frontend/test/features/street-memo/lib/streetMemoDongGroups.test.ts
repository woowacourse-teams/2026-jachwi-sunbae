import { describe, expect, it } from 'vitest';

import {
  dongMemoMarkers,
  groupMemosByDong,
  MEMO_INDIVIDUAL_MAX_LEVEL,
  showsDongMemoGroups,
} from '@/features/street-memo/lib/streetMemoDongGroups';
import type { StreetMemo } from '@/features/street-memo/model/StreetMemo';

const memo = (id: number, overrides: Partial<StreetMemo> = {}): StreetMemo => ({
  id,
  latitude: 37.5,
  longitude: 127.03,
  memo: `메모 ${id}`,
  preference: 'LIKE',
  isMine: false,
  adminDongCode: '11680640',
  ...overrides,
});

const memos = [
  memo(1, { latitude: 37.5, longitude: 127.03 }),
  memo(2, { latitude: 37.51, longitude: 127.05, preference: 'DISLIKE' }),
  memo(3, { latitude: 37.52, longitude: 127.04 }),
  memo(4, { adminDongCode: '11620695', latitude: 37.48, longitude: 126.93, preference: 'DISLIKE' }),
  memo(5, { adminDongCode: null }),
];

describe('groupMemosByDong', () => {
  it('행정동 코드가 같은 메모를 묶어 좋아요, 싫어요 수와 평균 좌표를 낸다', () => {
    const [second, first] = groupMemosByDong(memos);
    expect(first).toMatchObject({ adminDongCode: '11680640', positive: 2, negative: 1 });
    expect(first.latitude).toBeCloseTo(37.51, 6);
    expect(first.longitude).toBeCloseTo(127.04, 6);
    expect(first.memos.map((item) => item.id)).toEqual([1, 2, 3]);
    expect(second).toMatchObject({ adminDongCode: '11620695', positive: 0, negative: 1 });
  });

  it('행정동 코드가 없는 메모는 묶음에 넣지 않는다', () => {
    const grouped = groupMemosByDong(memos).flatMap((group) => group.memos.map((item) => item.id));
    expect(grouped).not.toContain(5);
    expect(groupMemosByDong([memo(9, { adminDongCode: null }), memo(10, { adminDongCode: undefined })])).toEqual([]);
  });
});

describe('showsDongMemoGroups', () => {
  it.each([
    [MEMO_INDIVIDUAL_MAX_LEVEL + 1, true],
    [MEMO_INDIVIDUAL_MAX_LEVEL + 0.5, true],
    [MEMO_INDIVIDUAL_MAX_LEVEL + 0.49, false],
    [MEMO_INDIVIDUAL_MAX_LEVEL, false],
    [3, false],
  ])('확대 단계 %s에서 묶음 여부는 %s다(정수 단계로 반올림)', (level, expected) => {
    expect(showsDongMemoGroups(level)).toBe(expected);
  });
});

describe('dongMemoMarkers', () => {
  it('묶음 단계에서는 화면의 메모를 모두 동 묶음으로 바꾸고 낱개 메모를 섞지 않는다', () => {
    const markers = dongMemoMarkers(memos, 7);
    expect(markers).toHaveLength(2);
    expect(markers.every((marker) => marker.id.startsWith('street-memo-dong:'))).toBe(true);
    expect(markers.find((marker) => marker.id === 'street-memo-dong:11680640')).toMatchObject({
      tally: { positive: 2, negative: 1 },
      label: '거리 메모 3개, 좋아요 2개, 싫어요 1개',
      variant: 'positive',
      category: 'MEMO',
      actionable: true,
    });
    expect(markers.find((marker) => marker.id === 'street-memo-dong:11620695')).toMatchObject({ variant: 'negative' });
  });

  it('낱개 단계에서는 행정동 코드가 없는 메모까지 모두 하나씩 보여 주고 묶지 않는다', () => {
    const markers = dongMemoMarkers(memos, MEMO_INDIVIDUAL_MAX_LEVEL);
    expect(markers.map((marker) => marker.id)).toEqual([1, 2, 3, 4, 5].map((id) => `street-memo:${id}`));
    expect(markers.every((marker) => marker.tally === undefined && !marker.actionable)).toBe(true);
    expect(markers[1]).toMatchObject({ label: '메모 2', variant: 'negative' });
  });

  it('긴 메모는 말풍선에 80자까지만 적는다', () => {
    const [marker] = dongMemoMarkers([memo(1, { memo: '가'.repeat(90) })], 3);
    expect(marker.label).toBe(`${'가'.repeat(80)}…`);
  });
});
