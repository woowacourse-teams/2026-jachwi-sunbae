import type { ChecklistSummary } from '@/features/checklist/model/checklistTypes';
import SelectionControl from '@/shared/ui/selection-control/SelectionControl';

import { SYSTEM_DEFAULT_ID } from '../../hooks/useChecklistSelection';

import styles from './ActiveChecklistOptions.module.css';

type ActiveChecklistOptionsProps = {
  items: ChecklistSummary[];
  selectedId: number | null;
  newlyCreatedId: number | null;
  isDisabled: boolean;
  onSelect: (checklistId: number) => void;
};

const ActiveChecklistOptions = ({
  items,
  selectedId,
  newlyCreatedId,
  isDisabled,
  onSelect,
}: ActiveChecklistOptionsProps) => (
  <fieldset className={`${styles.options} active-checklist-options`}>
    <legend className="sr-only">적용할 체크리스트</legend>
    <SelectionControl
      className={selectedId === SYSTEM_DEFAULT_ID ? 'is-selected' : undefined}
      name="active-checklist"
      value="SYSTEM_DEFAULT"
      checked={selectedId === SYSTEM_DEFAULT_ID}
      disabled={isDisabled}
      markClassName={styles.selectionMark}
      onSelect={() => onSelect(SYSTEM_DEFAULT_ID)}
    >
      <span>
        <strong>자취선배 기본 체크리스트</strong>
        <small>이 단계의 필수 항목으로 바로 시작</small>
      </span>
      <em>추천</em>
    </SelectionControl>
    {items.map((item) => (
      <SelectionControl
        key={item.checklistId}
        className={selectedId === item.checklistId ? 'is-selected' : undefined}
        name="active-checklist"
        value={String(item.checklistId)}
        checked={selectedId === item.checklistId}
        disabled={isDisabled}
        markClassName={styles.selectionMark}
        onSelect={() => onSelect(item.checklistId)}
      >
        <span>
          <strong>{item.name}</strong>
          <small>
            {item.itemCount}개 항목 · 매물 {item.assignedPropertyCount}곳에서 사용
          </small>
        </span>
        {newlyCreatedId === item.checklistId && <em>방금 생성</em>}
      </SelectionControl>
    ))}
  </fieldset>
);

export default ActiveChecklistOptions;
