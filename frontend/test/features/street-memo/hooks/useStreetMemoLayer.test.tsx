import { renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import useStreetMemoLayer from '@/features/street-memo/hooks/useStreetMemoLayer';
import type { StreetMemo } from '@/features/street-memo/model/StreetMemo';

const memo = (id: number, latitude: number, longitude: number): StreetMemo => ({
  id,
  latitude,
  longitude,
  memo: `메모 ${id}`,
  preference: 'LIKE',
  isMine: false,
});
const memos = [memo(1, 37.5, 127), memo(2, 37.501, 127.001), memo(3, 37.6, 127.2)];

vi.mock('@/features/street-memo/api/useStreetMemos', () => ({
  useStreetMemos: () => ({ memos, isFailed: false }),
  useStreetMemoMutations: () => ({
    create: { reset: vi.fn(), isPending: false, isError: false },
    remove: { reset: vi.fn(), isPending: false, isError: false },
  }),
}));

it('노출 지표에는 동네가 보이는 화면 안의 메모만 넘기고, 멀리 축소하면 넘기지 않는다', () => {
  // 위도 폭 약 1.1km 화면: 화면 밖(3번)은 빼고 1, 2번만 센다.
  const near = { south: 37.495, north: 37.505, west: 126.995, east: 127.005 };
  const { result, rerender } = renderHook(({ bounds }) => useStreetMemoLayer(true, bounds), {
    initialProps: { bounds: near },
  });
  expect(result.current.visibleMemos.map((item) => item.id)).toEqual([1, 2]);
  // 위도 폭 약 22km 화면: 메모가 개수 말풍선으로 뭉쳐 보이므로 세지 않는다.
  rerender({ bounds: { south: 37.4, north: 37.6, west: 126.8, east: 127.2 } });
  expect(result.current.visibleMemos).toEqual([]);
});

it('메모 겹을 끄면 노출 지표에 넘기지 않는다', () => {
  const { result } = renderHook(() =>
    useStreetMemoLayer(false, { south: 37.495, north: 37.505, west: 126.995, east: 127.005 }),
  );
  expect(result.current.visibleMemos).toEqual([]);
});
