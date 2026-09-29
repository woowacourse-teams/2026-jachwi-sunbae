import type { PointerEvent } from 'react';
import { useRef, useState } from 'react';

const DRAG_START_DISTANCE = 5;
/** 끌어 놓을 수 있는 목록 항목에 붙이는 속성. 목록 쪽 JSX와 이름을 맞춘다. */
const REORDER_ITEM_KEY_ATTRIBUTE = 'data-editor-item-key';

type PointerDrag = { sourceKey: string; targetKey: string; startX: number; startY: number; hasMoved: boolean };

const releaseCapture = (event: PointerEvent<HTMLElement>) => {
  if (event.currentTarget.hasPointerCapture(event.pointerId))
    event.currentTarget.releasePointerCapture(event.pointerId);
};

/** 손잡이를 끌어 놓은 목록 항목 위치로 순서를 바꾼다. 짧은 움직임은 클릭으로 본다. */
const usePointerReorder = (onReorder: (sourceKey: string, targetKey: string) => void, isDisabled: boolean) => {
  const dragRef = useRef<PointerDrag | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const reset = () => {
    dragRef.current = null;
    setDraggingKey(null);
    setDragOverKey(null);
  };

  const handleProps = (itemKey: string) => ({
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (!event.isPrimary || event.button !== 0 || isDisabled) return;
      if (event.pointerType !== 'mouse') event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        sourceKey: itemKey,
        targetKey: itemKey,
        startX: event.clientX,
        startY: event.clientY,
        hasMoved: false,
      };
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (drag === null) return;
      const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
      if (!drag.hasMoved && distance < DRAG_START_DISTANCE) return;
      drag.hasMoved = true;
      event.preventDefault();
      const targetKey = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>(`[${REORDER_ITEM_KEY_ATTRIBUTE}]`)
        ?.getAttribute(REORDER_ITEM_KEY_ATTRIBUTE);
      if (targetKey === null || targetKey === undefined) return;
      drag.targetKey = targetKey;
      setDraggingKey(drag.sourceKey);
      setDragOverKey(targetKey === drag.sourceKey ? null : targetKey);
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (drag === null) return;
      if (drag.hasMoved && drag.sourceKey !== drag.targetKey) onReorder(drag.sourceKey, drag.targetKey);
      reset();
      releaseCapture(event);
    },
    onPointerCancel: (event: PointerEvent<HTMLElement>) => {
      reset();
      releaseCapture(event);
    },
  });

  return { draggingKey, dragOverKey, handleProps };
};

export default usePointerReorder;
