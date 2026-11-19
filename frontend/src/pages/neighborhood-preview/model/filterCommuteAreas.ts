import type { CommuteArea } from '@/features/map/api/commuteApi';

/** 화면에서 거르는 조건. `maxRent`가 0이면 월세 전체다. */
export type CommuteAreaFilter = { maxMinutes: number; maxRent: number };

/** 서버에 보낸 통근 조건. 서버는 통근 시간과 환승 횟수로 동네를 고른다. */
export type CommuteFetchCriteria = { maxMinutes: number; maxTransfers: number };

type FilterableArea = Pick<CommuteArea, 'commuteMinutes' | 'rent'>;

/**
 * 받아 둔 동네를 통근 시간 상한과 월세 상한으로 거른다. 서버에 다시 묻지 않고 바로 지도와 목록에 반영할 때 쓴다.
 * - `withinCommute`: 통근 시간 상한 안의 동네. 지도에 그리는 동네다(월세 조건 밖은 회색으로 깐다).
 * - `matched`: 그 가운데 월세 조건까지 맞는 동네. 순위와 개수에 쓴다. 월세 시세가 없는 동네는 월세 전체일 때만 든다.
 */
export const filterCommuteAreas = <Area extends FilterableArea>(
  areas: readonly Area[],
  { maxMinutes, maxRent }: CommuteAreaFilter,
) => {
  const withinCommute = areas.filter((area) => area.commuteMinutes <= maxMinutes);
  const matched = withinCommute.filter(
    (area) => maxRent === 0 || (area.rent !== null && area.rent.monthlyRentKrw <= maxRent * 10000),
  );
  return { withinCommute, matched };
};

/**
 * 바꾼 조건을 보이려면 서버에 다시 물어야 하는지. 동네마다 환승 횟수는 오지 않아 환승이 바뀌면 다시 묻고,
 * 통근 시간은 받아 둔 상한보다 늘렸을 때만 다시 묻는다. 줄이면 받아 둔 결과를 거르기만 한다.
 */
export const needsCommuteRefetch = (fetched: CommuteFetchCriteria, wanted: CommuteFetchCriteria) =>
  wanted.maxTransfers !== fetched.maxTransfers || wanted.maxMinutes > fetched.maxMinutes;
