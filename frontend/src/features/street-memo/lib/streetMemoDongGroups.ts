import type { MapMarker } from '@/features/map/model/Map';

import type { StreetMemo } from '../model/StreetMemo';

/**
 * 동네 찾기 지도에서 메모를 하나씩 보여 주는 가장 먼 확대 단계(작을수록 가까움). 휴대폰 화면 폭이 약 1km인 단계다.
 * 이보다 멀면 화면의 메모를 모두 행정동 묶음으로, 이 단계부터는 모두 낱개로 보여 준다.
 */
export const MEMO_INDIVIDUAL_MAX_LEVEL = 5;
export const STREET_MEMO_DONG_MARKER_PREFIX = 'street-memo-dong:';
const INDIVIDUAL_MARKER_PREFIX = 'street-memo:';
const LABEL_MAX_LENGTH = 80;

/**
 * 지도가 멈춘 확대 단계로 묶음을 보여 줄지 정한다. 데스크탑 휠은 소수 단계로 멈추므로 정수 단계로 반올림해,
 * 한 단계 안에서는 묶음과 낱개가 섞이거나 오가지 않게 한다.
 */
export const showsDongMemoGroups = (level: number) => Math.round(level) > MEMO_INDIVIDUAL_MAX_LEVEL;

export type DongMemoGroup = {
  adminDongCode: string;
  latitude: number;
  longitude: number;
  positive: number;
  negative: number;
  memos: StreetMemo[];
};

/** 행정동 코드가 같은 메모를 묶는다. 묶음 자리는 그 동 메모의 평균 좌표다. 코드가 없는 메모는 묶지 않고 뺀다. */
export const groupMemosByDong = (memos: StreetMemo[]): DongMemoGroup[] => {
  const groups = new Map<string, StreetMemo[]>();
  for (const memo of memos) {
    if (!memo.adminDongCode) continue;
    groups.set(memo.adminDongCode, [...(groups.get(memo.adminDongCode) ?? []), memo]);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([adminDongCode, group]) => {
      const positive = group.filter((memo) => memo.preference === 'LIKE').length;
      return {
        adminDongCode,
        latitude: group.reduce((sum, memo) => sum + memo.latitude, 0) / group.length,
        longitude: group.reduce((sum, memo) => sum + memo.longitude, 0) / group.length,
        positive,
        negative: group.length - positive,
        memos: group,
      };
    });
};

const dongGroupMarker = (group: DongMemoGroup): MapMarker => ({
  id: `${STREET_MEMO_DONG_MARKER_PREFIX}${group.adminDongCode}`,
  latitude: group.latitude,
  longitude: group.longitude,
  label: `거리 메모 ${group.memos.length}개, 좋아요 ${group.positive}개, 싫어요 ${group.negative}개`,
  tally: { positive: group.positive, negative: group.negative },
  tone: 'destination',
  category: 'MEMO',
  variant: group.positive >= group.negative ? 'positive' : 'negative',
  // 누르면 그 동이 보이게 확대해 메모를 하나씩 보여 준다.
  actionable: true,
});

const memoMarker = (memo: StreetMemo): MapMarker => ({
  id: `${INDIVIDUAL_MARKER_PREFIX}${memo.id}`,
  latitude: memo.latitude,
  longitude: memo.longitude,
  label: memo.memo.length > LABEL_MAX_LENGTH ? `${memo.memo.slice(0, LABEL_MAX_LENGTH)}…` : memo.memo,
  tone: 'destination',
  category: 'MEMO',
  variant: memo.preference === 'LIKE' ? 'positive' : 'negative',
});

/**
 * 동네 찾기 지도의 거리 메모 마커. 확대 단계 하나로 화면 전체를 정한다.
 * 멀면 행정동마다 좋아요, 싫어요 개수 묶음 하나(코드 없는 메모는 숨김), 가까우면 모든 메모를 낱개 말풍선으로 둔다.
 * 낱개 말풍선은 글이 이미 보이므로 누르는 동작을 두지 않는다.
 */
export const dongMemoMarkers = (memos: StreetMemo[], level: number): MapMarker[] =>
  showsDongMemoGroups(level) ? groupMemosByDong(memos).map(dongGroupMarker) : memos.map(memoMarker);
