import type { PointerEvent } from 'react';
import { useCallback, useRef, useState } from 'react';

import type { MapPropertySheetStage } from '../ui/map-property-sheet/MapPropertySheet';

const SHEET_DRAG_THRESHOLD = 20;

const sheetStageHeights = (sheetRef: React.RefObject<HTMLElement | null>): Record<MapPropertySheetStage, number> => {
  const stageHeight = sheetRef.current?.parentElement?.getBoundingClientRect().height ?? 0;
  const rem = 16;
  return {
    closed: 4 * rem,
    mid: Math.min(stageHeight * 0.34, 18 * rem),
    full: Math.max(stageHeight - 4.25 * rem, 0),
  };
};

const useMapSheet = () => {
  const [sheetStage, setSheetStage] = useState<MapPropertySheetStage>('closed');
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const sheetRef = useRef<HTMLElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const dragStartRef = useRef<{ y: number; height: number } | null>(null);
  const draggedSheetRef = useRef(false);

  const handleDragStart = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    const height = sheetRef.current?.getBoundingClientRect().height ?? 0;
    dragStartRef.current = { y: event.clientY, height };
    touchStartYRef.current = event.clientY;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const handleDragMove = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    const start = dragStartRef.current;
    if (start === null) return;
    const heights = sheetStageHeights(sheetRef);
    const next = start.height + (start.y - event.clientY);
    setDragHeight(Math.min(Math.max(next, heights.closed), heights.full));
  }, []);

  const handleDragEnd = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    const start = dragStartRef.current;
    const startY = touchStartYRef.current;
    dragStartRef.current = null;
    touchStartYRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setDragHeight(null);
    if (start === null || startY === null) return;
    if (Math.abs(event.clientY - startY) <= SHEET_DRAG_THRESHOLD) return;

    draggedSheetRef.current = true;
    const heights = sheetStageHeights(sheetRef);
    const released = start.height + (start.y - event.clientY);
    const nearest = (Object.entries(heights) as Array<[MapPropertySheetStage, number]>).reduce((best, entry) =>
      Math.abs(entry[1] - released) < Math.abs(best[1] - released) ? entry : best,
    );
    setSheetStage(nearest[0]);
  }, []);

  const handleDragCancel = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    touchStartYRef.current = null;
    dragStartRef.current = null;
    setDragHeight(null);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }, []);

  const cycleSheetStage = useCallback(() => {
    if (draggedSheetRef.current) {
      draggedSheetRef.current = false;
      return;
    }
    setSheetStage((current) => (current === 'closed' ? 'mid' : current === 'mid' ? 'full' : 'closed'));
  }, []);

  return {
    sheetRef,
    sheetStage,
    setSheetStage,
    dragHeight,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
    cycleSheetStage,
  };
};

export default useMapSheet;
