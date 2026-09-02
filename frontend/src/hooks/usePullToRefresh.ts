import { useCallback, useEffect, useRef, useState } from 'react';

/** 이 거리만큼 당기면 새로고침한다. */
const TRIGGER_DISTANCE = 72;
/** 당긴 거리를 그대로 쓰지 않고 눌러서, 손끝보다 덜 따라오게 한다. */
const RESISTANCE = 0.45;
const MAX_PULL = 96;

type PullToRefresh = {
  /** 현재 당겨진 거리(px). 0이면 당기는 중이 아니다. */
  pullDistance: number;
  refreshing: boolean;
  handlers: {
    onTouchStart: (event: React.TouchEvent) => void;
    onTouchMove: (event: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
};

/**
 * 문서가 아니라 안쪽 스크롤러가 스크롤을 맡는 화면에서 당겨서 새로고침을 직접 만든다.
 * `body { overflow: hidden }`이면 브라우저 기본 제스처가 발동하지 않는다.
 */
export const usePullToRefresh = (
  scrollerRef: React.RefObject<HTMLElement | null>,
  onRefresh: () => void = () => window.location.reload(),
): PullToRefresh => {
  const startYRef = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = useCallback(
    (event: React.TouchEvent) => {
      // 맨 위에 있을 때만 당김으로 본다. 목록을 읽는 중에는 방해하지 않는다.
      if ((scrollerRef.current?.scrollTop ?? 0) > 0 || refreshing) return;
      startYRef.current = event.touches[0].clientY;
    },
    [refreshing, scrollerRef],
  );

  const onTouchMove = useCallback(
    (event: React.TouchEvent) => {
      const startY = startYRef.current;
      if (startY === null) return;
      if ((scrollerRef.current?.scrollTop ?? 0) > 0) {
        startYRef.current = null;
        setPullDistance(0);
        return;
      }
      const moved = event.touches[0].clientY - startY;
      setPullDistance(moved <= 0 ? 0 : Math.min(moved * RESISTANCE, MAX_PULL));
    },
    [scrollerRef],
  );

  const onTouchEnd = useCallback(() => {
    if (startYRef.current === null) return;
    startYRef.current = null;
    setPullDistance((current) => {
      if (current >= TRIGGER_DISTANCE) setRefreshing(true);
      return 0;
    });
  }, []);

  useEffect(() => {
    if (!refreshing) return;
    onRefresh();
  }, [onRefresh, refreshing]);

  return { pullDistance, refreshing, handlers: { onTouchStart, onTouchMove, onTouchEnd } };
};
