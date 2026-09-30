import type { KeyboardEventHandler, PointerEventHandler, ReactNode, Ref } from 'react';

import styles from './ChecklistItemRow.module.css';

type ChecklistItemRowProps = {
  itemKey: string;
  question: string;
  guide?: string | null;
  originLabel?: string;
  inactiveNote?: string;
  isDisabled?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  dragHandleLabel: string;
  removeLabel?: string;
  contentRef?: Ref<HTMLElement>;
  onDragHandleKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
  onRemove?: () => void;
  dragHandleProps?: {
    onPointerDown?: PointerEventHandler<HTMLButtonElement>;
    onPointerMove?: PointerEventHandler<HTMLButtonElement>;
    onPointerUp?: PointerEventHandler<HTMLButtonElement>;
    onPointerCancel?: PointerEventHandler<HTMLButtonElement>;
  };
  trailing?: ReactNode;
};

/** 체크리스트 항목의 표시 구조만 담당한다. 순서 변경·삭제 같은 동작은 바깥 기능 컴포넌트가 주입한다. */
const ChecklistItemRow = ({
  itemKey,
  question,
  guide,
  originLabel,
  inactiveNote,
  isDisabled = false,
  isDragging = false,
  isDragOver = false,
  dragHandleLabel,
  removeLabel,
  contentRef,
  onDragHandleKeyDown,
  onRemove,
  dragHandleProps,
  trailing,
}: ChecklistItemRowProps) => (
  <li
    className={styles.item}
    data-editor-item-key={itemKey}
    data-dragging={isDragging || undefined}
    data-drag-over={isDragOver || undefined}
  >
    <button
      type="button"
      className={styles.dragHandle}
      disabled={isDisabled}
      aria-label={dragHandleLabel}
      onKeyDown={onDragHandleKeyDown}
      {...dragHandleProps}
    >
      <span aria-hidden="true">≡</span>
    </button>
    <div className={styles.copy}>
      {originLabel !== undefined && <span className="sr-only">{originLabel}</span>}
      <strong ref={contentRef} tabIndex={-1}>
        {question}
      </strong>
      {guide !== undefined && guide !== null && <small>{guide}</small>}
      {inactiveNote !== undefined && <small className={styles.inactiveNote}>{inactiveNote}</small>}
    </div>
    {(onRemove !== undefined || trailing !== undefined) && (
      <span className={styles.actions}>
        {trailing}
        {onRemove !== undefined && (
          <button
            type="button"
            className={styles.removeButton}
            disabled={isDisabled}
            aria-label={removeLabel ?? `${question} 제거`}
            onClick={onRemove}
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </span>
    )}
  </li>
);

export default ChecklistItemRow;
