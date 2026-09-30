import type { ChecklistEditorItem } from '../../model/ChecklistEditor';
import usePointerReorder from './usePointerReorder';

import styles from './ChecklistEditor.module.css';

type ChecklistItemOrderListProps = {
  items: ChecklistEditorItem[];
  isDisabled: boolean;
  isInactive: (item: ChecklistEditorItem) => boolean;
  registerFocusTarget: (clientKey: string) => (element: HTMLElement | null) => void;
  onMove: (index: number, direction: -1 | 1, focusContent?: boolean) => void;
  onReorder: (sourceKey: string, targetKey: string) => void;
  onRemove: (index: number) => void;
};

/** 담은 체크 항목의 확인 순서. 손잡이를 끌거나 방향키로 순서를 바꾼다. */
const ChecklistItemOrderList = ({
  items,
  isDisabled,
  isInactive,
  registerFocusTarget,
  onMove,
  onReorder,
  onRemove,
}: ChecklistItemOrderListProps) => {
  const { draggingKey, dragOverKey, handleProps } = usePointerReorder(onReorder, isDisabled);

  return (
    <ol className={styles.selectedCheckItems}>
      {items.map((item, index) => (
        <li
          key={item.clientKey}
          data-editor-item-key={item.clientKey}
          data-dragging={draggingKey === item.clientKey || undefined}
          data-drag-over={dragOverKey === item.clientKey || undefined}
        >
          <button
            type="button"
            className={styles.dragHandle}
            disabled={isDisabled}
            aria-label={`${item.question} 순서 변경`}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
              event.preventDefault();
              onMove(index, event.key === 'ArrowUp' ? -1 : 1, false);
            }}
            {...handleProps(item.clientKey)}
          >
            <span aria-hidden="true">≡</span>
          </button>
          <div className={styles.itemCopy}>
            <span className={`sr-only item-origin item-origin--${item.origin.toLowerCase()}`}>
              {item.origin === 'PROVIDED' ? '제공 항목' : '이전 사용자 항목'}
            </span>
            <strong ref={registerFocusTarget(item.clientKey)} tabIndex={-1}>
              {item.question}
            </strong>
            {item.guide !== null && <small>{item.guide}</small>}
            {item.origin === 'CUSTOM' && (
              <small className={styles.inactiveItemNote}>이전에 추가된 항목 · 이동 또는 제거 가능</small>
            )}
            {isInactive(item) && (
              <small className={styles.inactiveItemNote}>더 이상 제공되지 않음 · 유지, 이동 또는 제거 가능</small>
            )}
          </div>
          <span className={styles.itemActions}>
            <button
              type="button"
              className={styles.removeItemButton}
              disabled={isDisabled}
              aria-label={`${item.question} 제거`}
              onClick={() => onRemove(index)}
            >
              <span aria-hidden="true">×</span>
            </button>
          </span>
        </li>
      ))}
    </ol>
  );
};

export default ChecklistItemOrderList;
