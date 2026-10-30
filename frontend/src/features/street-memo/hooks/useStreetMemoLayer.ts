import { useEffect, useMemo, useState } from 'react';

import { isInBounds } from '@/features/map/lib/mapViewportQuery';
import type { MapBounds, MapMarker } from '@/features/map/model/Map';
import { useLogger } from '@/shared/lib/analytics/logging';

import { useStreetMemoMutations, useStreetMemos } from '../api/useStreetMemos';
import { OVERLAP_HEIGHT_RATIO, OVERLAP_WIDTH_RATIO } from '../lib/streetMemoFocus';
import type { StreetMemo, StreetMemoPreference } from '../model/StreetMemo';

export const STREET_MEMO_MARKER_PREFIX = 'street-memo:';
const DRAFT_MARKER_ID = 'street-memo-draft';
/** 방금 남긴 메모를 떠오르는 말풍선으로 표시해 두는 시간. 목록을 다시 받아 오기 전에도 그 자리에 보이게 한다. */
const FLASH_DURATION_MS = 2400;
const LABEL_MAX_LENGTH = 80;

type Point = { latitude: number; longitude: number };

/** 여러 메모가 한꺼번에 나타날 때 튀어나오는 시점을 엇갈리게 하는 간격과 단계 수. */
const POP_STAGGER_MS = 60;
const POP_STAGGER_STEPS = 6;

/** 메모 순위를 볼 수 있게 노출과 열람 이벤트에 함께 싣는 메모 정보. 거리 메모는 지도에서 누구나 보는 공개 글이라 내용도 싣는다. */
export const memoLogParams = (memo: StreetMemo) => ({
  memo_id: memo.id,
  preference: memo.preference,
  memo: memo.memo,
});

const markerLabel = (memo: StreetMemo) =>
  memo.memo.length > LABEL_MAX_LENGTH ? `${memo.memo.slice(0, LABEL_MAX_LENGTH)}…` : memo.memo;

const markerId = (group: StreetMemo[]) => `${STREET_MEMO_MARKER_PREFIX}${group.map((memo) => memo.id).join(',')}`;

/**
 * 화면에서 말풍선이 겹칠 만큼 가까운 메모를 한 무리로 묶는다. 새 메모가 무리의 대표가 되도록 최신순으로 넣는다.
 * 화면 범위를 모르면 좌표가 똑같은 메모만 묶는다.
 */
const groupOverlapping = (memos: StreetMemo[], bounds: MapBounds | null): StreetMemo[][] => {
  const latitudeGap = bounds ? (bounds.north - bounds.south) * OVERLAP_HEIGHT_RATIO : 0;
  const longitudeGap = bounds ? (bounds.east - bounds.west) * OVERLAP_WIDTH_RATIO : 0;
  const groups: StreetMemo[][] = [];
  for (const memo of [...memos].sort((left, right) => right.id - left.id)) {
    const group = groups.find(
      ([head]) =>
        Math.abs(head.latitude - memo.latitude) <= latitudeGap &&
        Math.abs(head.longitude - memo.longitude) <= longitudeGap,
    );
    if (group) group.push(memo);
    else groups.push([memo]);
  }
  return groups;
};

const groupMarker = (group: StreetMemo[], appear: boolean): MapMarker => {
  const [head] = group;
  const positive = group.filter((memo) => memo.preference === 'LIKE').length;
  const negative = group.length - positive;
  const isGroup = group.length > 1;
  return {
    id: markerId(group),
    latitude: head.latitude,
    longitude: head.longitude,
    // 겹친 메모는 글 대신 좋아요·싫어요 개수를 두 색으로 나눠 그린다. 글은 누르면 목록에서 본다.
    label: isGroup ? `거리 메모 ${group.length}개, 좋아요 ${positive}개, 싫어요 ${negative}개` : markerLabel(head),
    tally: isGroup ? { positive, negative } : undefined,
    // 메모는 아이콘 대신 말풍선으로 띄운다. 좋아요는 파랑, 싫어요는 빨강이고, 묶음의 꼬리는 많은 쪽 색을 따른다.
    tone: 'destination',
    category: 'MEMO',
    variant: (isGroup ? positive >= negative : head.preference === 'LIKE') ? 'positive' : 'negative',
    appear,
    // 방금 남긴 메모는 떠오르는 효과를 쓰고, 나머지는 튀어나온다. 시점은 메모 id로 정해 다시 그려도 같다.
    pop: appear ? undefined : { delayMs: (head.id % POP_STAGGER_STEPS) * POP_STAGGER_MS },
    actionable: true,
  };
};

/**
 * 지도 위 거리 메모 한 겹. 인프라 지도와 동네 찾기 지도가 함께 쓴다.
 * 켜져 있으면 화면 안 메모를 글이 든 말풍선으로 올리고(겹치는 메모는 좋아요·싫어요 개수 말풍선으로 묶는다), 고른 메모를 보거나(view) 찍은 위치에 새로 쓰는(compose) 상태를 가진다.
 * 메모를 남기면 상세를 열지 않고, 남긴 메모 말풍선이 그 자리에서 아래에서 떠오르며 나타난다(flash).
 * 화면 모양(데스크탑 칸·휴대폰 시트)은 지도 화면이 고르고, 이 Hook은 무엇을 보여줄지만 정한다.
 */
const useStreetMemoLayer = (enabled: boolean, bounds: MapBounds | null) => {
  const { memos, isFailed } = useStreetMemos(enabled ? bounds : null);
  const { create, remove } = useStreetMemoMutations();
  const { log } = useLogger();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [draftPoint, setDraftPoint] = useState<Point | null>(null);
  // 방금 남긴 메모는 상세를 열지 않고, 그 자리에 글을 잠깐 띄웠다가 지운다.
  const [flash, setFlash] = useState<StreetMemo | null>(null);
  useEffect(() => {
    if (flash === null) return;
    const timer = window.setTimeout(() => setFlash(null), FLASH_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [flash]);

  // 지금 화면 안에 보이는 메모. 지도를 옮기는 동안 남아 있는 이전 범위의 메모는 화면 밖이라 빼고, 노출 지표에 쓴다.
  const visibleMemos = useMemo(
    () => (enabled && bounds ? memos.filter((memo) => isInBounds(memo, bounds)) : []),
    [enabled, bounds, memos],
  );

  const memoGroups = useMemo(() => {
    const shown = enabled ? memos : [];
    // 방금 남긴 메모는 떠오르는 동안 다른 메모와 묶지 않고, 목록을 다시 받아 오기 전이나 메모를 숨긴 배율에서도 그 자리에 둔다.
    const rest = flash ? shown.filter((memo) => memo.id !== flash.id) : shown;
    return groupOverlapping(rest, bounds);
  }, [enabled, memos, flash, bounds]);
  const memoMarkers = useMemo<MapMarker[]>(
    () => [...memoGroups.map((group) => groupMarker(group, false)), ...(flash ? [groupMarker([flash], true)] : [])],
    [memoGroups, flash],
  );
  const markers = useMemo<MapMarker[]>(
    () => [
      ...memoMarkers,
      ...(draftPoint ? [{ ...draftPoint, id: DRAFT_MARKER_ID, label: '메모 위치', tone: 'destination' as const }] : []),
    ],
    [memoMarkers, draftPoint],
  );
  // 최신순으로 보여 준다. 지운 메모는 목록을 다시 받아 오면 빠진다.
  const selectedMemos = memos.filter((memo) => selectedIds.includes(memo.id)).sort((left, right) => right.id - left.id);
  // 배율을 바꿔 무리가 달라져도 고른 메모가 든 말풍선을 고른 것으로 표시한다.
  const selectedGroup =
    selectedMemos.length > 0 ? memoGroups.find((group) => group.some((memo) => memo.id === selectedMemos[0].id)) : null;

  const close = () => {
    setSelectedIds([]);
    setDraftPoint(null);
    create.reset();
    remove.reset();
  };

  return {
    markers,
    visibleMemos,
    isFailed: enabled && isFailed,
    /** compose: 찍은 위치에 새로 쓰는 중, view: 지도에서 고른 메모를 보는 중. */
    mode: draftPoint ? ('compose' as const) : selectedMemos.length > 0 ? ('view' as const) : null,
    /** 고른 말풍선에 묶인 메모. 겹친 메모가 없으면 하나다. */
    selectedMemos,
    selectedMarkerId: selectedGroup ? markerId(selectedGroup) : null,
    isSubmitting: create.isPending,
    submitFailed: create.isError,
    /** 지우는 중이거나 지우지 못한 메모의 id. 여러 메모를 함께 볼 때 어느 메모의 상태인지 가린다. */
    removingId: remove.isPending ? (remove.variables ?? null) : null,
    removeFailedId: remove.isError ? (remove.variables ?? null) : null,
    /** 메모 마커에 묶인 메모. 지도를 그 메모들로 옮길 때 쓴다. 메모 마커가 아니면 빈 목록이다. */
    memosOf: (marker: MapMarker): StreetMemo[] =>
      memoGroups.find((group) => markerId(group) === marker.id) ??
      (flash && marker.id === markerId([flash]) ? [flash] : []),
    /** 메모 마커면 열고 true를 돌려준다. 다른 마커는 지도 화면이 처리하게 false를 돌려준다. */
    selectMarker: (marker: MapMarker): boolean => {
      if (!marker.id.startsWith(STREET_MEMO_MARKER_PREFIX)) return false;
      create.reset();
      remove.reset();
      setDraftPoint(null);
      const ids = marker.id.slice(STREET_MEMO_MARKER_PREFIX.length).split(',').map(Number);
      // 겹친 메모 묶음을 열면 묶음 안의 메모를 하나씩 열람으로 남긴다.
      for (const memo of memos.filter((item) => ids.includes(item.id)))
        log('street_memo_viewed', { ...memoLogParams(memo), group_size: ids.length });
      setSelectedIds(ids);
      return true;
    },
    startDraft: (point: Point) => {
      create.reset();
      setSelectedIds([]);
      setDraftPoint(point);
    },
    submit: (memo: string, preference: StreetMemoPreference, onCreated?: (memo: StreetMemo) => void) => {
      if (draftPoint === null) return;
      create.mutate(
        { ...draftPoint, memo, preference },
        {
          onSuccess: (saved) => {
            log('street_memo_created', { preference: saved.preference, memo_length: saved.memo.length });
            setDraftPoint(null);
            setFlash(saved);
            onCreated?.(saved);
          },
        },
      );
    },
    remove: (memo: StreetMemo) => {
      remove.mutate(memo.id, {
        onSuccess: () => {
          log('street_memo_deleted', { preference: memo.preference });
          // 함께 보던 메모가 남아 있으면 그 메모들은 계속 보여 준다.
          const rest = selectedIds.filter((id) => id !== memo.id);
          if (rest.length === 0) close();
          else setSelectedIds(rest);
        },
      });
    },
    close,
  };
};

export type StreetMemoLayer = ReturnType<typeof useStreetMemoLayer>;

export default useStreetMemoLayer;
