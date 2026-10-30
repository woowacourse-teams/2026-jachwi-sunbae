import type { MapBounds } from '@/features/map/model/Map';

type Point = { latitude: number; longitude: number };

/**
 * 말풍선이 거의 같은 자리에 겹친다고 볼 거리. 지도 화면 폭과 높이에 대한 비율이라 확대 배율이 바뀌어도 화면에서 같은 간격이 된다.
 * 조금 겹치는 정도는 그대로 두고, 아래 말풍선을 누를 수 없을 만큼 포개질 때만 묶는다.
 */
export const OVERLAP_WIDTH_RATIO = 0.06;
export const OVERLAP_HEIGHT_RATIO = 0.03;

/** 메모 하나를 눌렀을 때 다가가는 배율. 메모 둘레 몇 블록이 함께 보이는 정도로, 너무 바짝 붙지 않는다. */
export const SINGLE_MEMO_LEVEL = 5;
/** 겹쳐 묶인 메모를 갈라 보려고 다가갈 때 넘지 않는 가장 가까운 배율. 그보다 붙으면 어디인지 알기 어렵다. */
export const CLOSEST_LEVEL = 3;

/**
 * 고른 메모가 보이도록 지도를 옮길 중심과 배율을 정한다. 배율은 클수록 멀리 보인다.
 * 메모 하나면 그 메모로 다가가고, 겹쳐 묶인 메모면 말풍선이 서로 떨어져 보일 때까지 확대한다.
 * 한 단계 확대할 때마다 화면 범위가 반으로 줄어 겹침 간격도 반이 되므로, 메모끼리 벌어진 거리보다 간격이 작아지는 단계를 고른다.
 */
export const focusOnMemos = (memos: Point[], bounds: MapBounds | null, level: number) => {
  const center = {
    latitude: memos.reduce((sum, memo) => sum + memo.latitude, 0) / memos.length,
    longitude: memos.reduce((sum, memo) => sum + memo.longitude, 0) / memos.length,
  };
  if (memos.length === 1) return { center, level: Math.min(level, SINGLE_MEMO_LEVEL) };

  const spread = (values: number[]) => Math.max(...values) - Math.min(...values);
  const stepsToSeparate = (gap: number, distance: number) =>
    distance > 0 && gap > 0 ? Math.max(1, Math.floor(Math.log2(gap / distance)) + 1) : Infinity;
  const steps = bounds
    ? Math.min(
        stepsToSeparate(
          (bounds.north - bounds.south) * OVERLAP_HEIGHT_RATIO,
          spread(memos.map((memo) => memo.latitude)),
        ),
        stepsToSeparate((bounds.east - bounds.west) * OVERLAP_WIDTH_RATIO, spread(memos.map((memo) => memo.longitude))),
      )
    : 2;
  // 이미 가장 가까운 배율보다 붙어 보고 있으면 멀어지지 않게 지금 배율을 넘지 않는다.
  return { center, level: Math.min(level, Math.max(CLOSEST_LEVEL, Math.min(level - steps, SINGLE_MEMO_LEVEL))) };
};
