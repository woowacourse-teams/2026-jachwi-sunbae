import { css, cx } from '@emotion/css';

import type { ChecklistSummary } from '@/features/checklist/model/checklistTypes';
import SelectionControl from '@/shared/ui/selection-control/SelectionControl';

import { SYSTEM_DEFAULT_ID } from '../../hooks/useChecklistSelection';

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

const styles = {
  // 다른 요소의 선택자에서 `.ActiveChecklistOptions-options`로 가리킨다.
  options: cx(
    css`
      label: ActiveChecklistOptions-options;
      display: grid;
      gap: 0.55rem;
      margin: 0;
      padding: 0;
      border: 0;

      & label {
        display: grid;
        grid-template-columns: 1.75rem minmax(0, 1fr) auto;
        align-items: center;
        gap: 0.55rem;
        min-height: 5.25rem;
        padding: 0.9rem 1rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
        cursor: pointer;
      }

      & label.is-selected {
        border-color: var(--color-primary);
        background: var(--color-surface);
      }

      & input {
        width: 1.75rem;
        height: 1.75rem;
        margin: 0;
        border: 1px solid var(--color-border);
        border-radius: 50%;
        appearance: none;
        cursor: pointer;
      }

      & input:checked {
        border-color: var(--color-primary);
        background: var(--color-primary);
        box-shadow: inset 0 0 0 0.5rem var(--color-surface);
      }

      & input:focus-visible {
        outline: 2px solid var(--color-focus);
        outline-offset: 2px;
      }

      & strong,
      & small {
        display: block;
        overflow-wrap: anywhere;
      }

      & strong {
        font-size: 0.76rem;
        line-height: 1.4;
      }

      & small {
        margin-top: 0.1rem;
        color: var(--color-muted);
        font-size: 0.65rem;
      }

      & em {
        padding: 0.3rem 0.45rem;
        border-radius: 999px;
        background: var(--color-primary);
        color: var(--color-on-primary);
        font-size: 0.65rem;
        font-style: normal;
        font-weight: 800;
      }
    `,
    'ActiveChecklistOptions-options',
  ),

  selectionMark: css`
    label: ActiveChecklistOptions-selectionMark;
    display: grid;
    width: 1.35rem;
    height: 1.35rem;
    border: 1px solid var(--color-border-strong, #d7d9dc);
    border-radius: 50%;
    color: var(--color-on-primary);
    font-size: 0.72rem;
    font-weight: 800;
    place-items: center;

    .ActiveChecklistOptions-options label.is-selected & {
      border-color: var(--color-primary);
      background: var(--color-primary);
    }
  `,
};

export default ActiveChecklistOptions;
