import ChecklistItemRow from '@/features/checklist/ui/checklist-item-row/ChecklistItemRow';

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

/** 순서 변경 상태와 기능 콜백을 관리하고, 표시 구조는 체크리스트 UI 컴포넌트에 위임한다. */
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
        <ChecklistItemRow
          key={item.clientKey}
          itemKey={item.clientKey}
          question={item.question}
          guide={item.guide}
          originLabel={item.origin === 'PROVIDED' ? '제공 항목' : '이전 사용자 항목'}
          inactiveNote={
            item.origin === 'CUSTOM'
              ? '이전에 추가된 항목 · 이동 또는 제거 가능'
              : isInactive(item)
                ? '더 이상 제공되지 않음 · 유지, 이동 또는 제거 가능'
                : undefined
          }
          isDisabled={isDisabled}
          isDragging={draggingKey === item.clientKey}
          isDragOver={dragOverKey === item.clientKey}
          dragHandleLabel={`${item.question} 순서 변경`}
          removeLabel={`${item.question} 제거`}
          contentRef={registerFocusTarget(item.clientKey)}
          dragHandleProps={handleProps(item.clientKey)}
          onDragHandleKeyDown={(event) => {
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
            event.preventDefault();
            onMove(index, event.key === 'ArrowUp' ? -1 : 1, false);
          }}
          onRemove={() => onRemove(index)}
        />
      ))}
    </ol>
  );
};

export default ChecklistItemOrderList;
