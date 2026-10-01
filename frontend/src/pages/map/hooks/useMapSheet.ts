import type { PointerEvent } from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

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
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const dragStartRef = useRef<{ y: number; height: number } | null>(null);
  const dragHeightsRef = useRef<Record<MapPropertySheetStage, number> | null>(null);
  const pendingClientYRef = useRef<number | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const draggedSheetRef = useRef(false);

  const clearDragStyles = useCallback(() => {
    if (dragFrameRef.current !== null) {
      window.cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    }
    pendingClientYRef.current = null;
    sheetRef.current?.style.removeProperty('transition');
    sheetRef.current?.parentElement?.style.removeProperty('--map-sheet-drag-height');
  }, []);

  const syncSheetStageTransform = useCallback((stage: MapPropertySheetStage) => {
    const sheet = sheetRef.current;
    if (sheet === null) return;

    const heights = sheetStageHeights(sheetRef);
    const offset = Math.max(heights.full - heights[stage], 0);
    sheet.style.transform = `translate3d(0, ${offset}px, 0)`;
  }, []);

  useLayoutEffect(() => {
    syncSheetStageTransform(sheetStage);
  }, [sheetStage, syncSheetStageTransform]);

  const applyDragHeight = useCallback((clientY: number) => {
    const start = dragStartRef.current;
    const heights = dragHeightsRef.current;
    const sheet = sheetRef.current;
    if (start === null || heights === null || sheet === null) return;

    const next = Math.min(Math.max(start.height + (start.y - clientY), heights.closed), heights.full);
    sheet.style.transform = `translate3d(0, ${Math.max(heights.full - next, 0)}px, 0)`;
    sheet.parentElement?.style.setProperty('--map-sheet-drag-height', `${next}px`);
  }, []);

  const scheduleDragHeight = useCallback(
    (clientY: number) => {
      pendingClientYRef.current = clientY;
      if (dragFrameRef.current !== null) return;

      dragFrameRef.current = window.requestAnimationFrame(() => {
        dragFrameRef.current = null;
        const pendingClientY = pendingClientYRef.current;
        pendingClientYRef.current = null;
        if (pendingClientY !== null) applyDragHeight(pendingClientY);
      });
    },
    [applyDragHeight],
  );

  const handleDragStart = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const heights = sheetStageHeights(sheetRef);
      dragStartRef.current = { y: event.clientY, height: heights[sheetStage] };
      dragHeightsRef.current = heights;
      touchStartYRef.current = event.clientY;
      sheetRef.current?.style.setProperty('transition', 'none');
      setIsDragging(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [sheetStage],
  );

  const handleDragMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (dragStartRef.current === null) return;
      scheduleDragHeight(event.clientY);
    },
    [scheduleDragHeight],
  );

  const handleDragEnd = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const start = dragStartRef.current;
      const startY = touchStartYRef.current;
      const heights = dragHeightsRef.current;
      applyDragHeight(event.clientY);
      dragStartRef.current = null;
      dragHeightsRef.current = null;
      touchStartYRef.current = null;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      clearDragStyles();
      setIsDragging(false);
      if (start === null || startY === null) {
        syncSheetStageTransform(sheetStage);
        return;
      }
      if (Math.abs(event.clientY - startY) <= SHEET_DRAG_THRESHOLD) {
        syncSheetStageTransform(sheetStage);
        return;
      }

      draggedSheetRef.current = true;
      if (heights === null) {
        syncSheetStageTransform(sheetStage);
        return;
      }
      const released = start.height + (start.y - event.clientY);
      const nearest = (Object.entries(heights) as Array<[MapPropertySheetStage, number]>).reduce((best, entry) =>
        Math.abs(entry[1] - released) < Math.abs(best[1] - released) ? entry : best,
      );
      setSheetStage(nearest[0]);
    },
    [applyDragHeight, clearDragStyles, sheetStage, syncSheetStageTransform],
  );

  const handleDragCancel = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      touchStartYRef.current = null;
      dragStartRef.current = null;
      dragHeightsRef.current = null;
      clearDragStyles();
      setIsDragging(false);
      syncSheetStageTransform(sheetStage);
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    },
    [clearDragStyles, sheetStage, syncSheetStageTransform],
  );

  const cycleSheetStage = useCallback(() => {
    if (draggedSheetRef.current) {
      draggedSheetRef.current = false;
      return;
    }
    setSheetStage((current) => (current === 'closed' ? 'mid' : current === 'mid' ? 'full' : 'closed'));
  }, []);

  const expandSheet = useCallback(() => setSheetStage('full'), []);
  const closeSheet = useCallback(() => setSheetStage('closed'), []);

  return {
    sheetRef,
    sheetStage,
    isDragging,
    expandSheet,
    closeSheet,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
    cycleSheetStage,
  };
};

export default useMapSheet;
