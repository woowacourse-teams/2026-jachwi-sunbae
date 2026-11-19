import { describe, expect, it } from 'vitest';

import { filterCommuteAreas, needsCommuteRefetch } from '@/pages/neighborhood-preview/model/filterCommuteAreas';

const rent = (manwon: number) => ({
  monthlyRentKrw: manwon * 10000,
  depositKrw: 0,
  transactionCount: 5,
  legalDongNames: [],
});
const areas = [
  { id: 'a', commuteMinutes: 12, rent: rent(50) },
  { id: 'b', commuteMinutes: 28, rent: rent(80) },
  { id: 'c', commuteMinutes: 35, rent: null },
  { id: 'd', commuteMinutes: 55, rent: rent(40) },
];
const ids = (list: readonly { id: string }[]) => list.map((area) => area.id);

describe('filterCommuteAreas', () => {
  it('통근 시간 상한을 넘는 동네는 지도에서도 뺀다', () => {
    const result = filterCommuteAreas(areas, { maxMinutes: 30, maxRent: 0 });
    expect(ids(result.withinCommute)).toEqual(['a', 'b']);
    expect(ids(result.matched)).toEqual(['a', 'b']);
  });

  it('월세 상한은 순위에서만 빼고 지도에는 남긴다. 시세가 없는 동네는 월세 전체일 때만 든다', () => {
    const all = filterCommuteAreas(areas, { maxMinutes: 60, maxRent: 0 });
    expect(ids(all.matched)).toEqual(['a', 'b', 'c', 'd']);
    const cheap = filterCommuteAreas(areas, { maxMinutes: 60, maxRent: 60 });
    expect(ids(cheap.withinCommute)).toEqual(['a', 'b', 'c', 'd']);
    expect(ids(cheap.matched)).toEqual(['a', 'd']);
  });
});

describe('needsCommuteRefetch', () => {
  const fetched = { maxMinutes: 40, maxTransfers: 1 };
  it('통근 시간을 줄이면 받아 둔 결과를 거르기만 한다', () => {
    expect(needsCommuteRefetch(fetched, { maxMinutes: 20, maxTransfers: 1 })).toBe(false);
    expect(needsCommuteRefetch(fetched, { maxMinutes: 40, maxTransfers: 1 })).toBe(false);
  });
  it('받아 둔 상한보다 늘리거나 환승을 바꾸면 다시 묻는다', () => {
    expect(needsCommuteRefetch(fetched, { maxMinutes: 50, maxTransfers: 1 })).toBe(true);
    expect(needsCommuteRefetch(fetched, { maxMinutes: 20, maxTransfers: 0 })).toBe(true);
  });
});
