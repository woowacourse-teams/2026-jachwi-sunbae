import { css } from '@emotion/css';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { getChecklistErrorMessage } from '@/features/checklist/api/checklistErrorMessages';
import { useRemoveChecklist } from '@/features/checklist/api/useChecklistMutations';
import type { ChecklistSummary } from '@/features/checklist/model/checklistTypes';
import ConfirmDialog from '@/shared/ui/confirm-dialog/ConfirmDialog';
import Icon from '@/shared/ui/icon/Icon';

const ChecklistListCard = ({ checklist }: { checklist: ChecklistSummary }) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const remove = useRemoveChecklist(checklist.checklistId);

  const deleteChecklist = async () => {
    try {
      await remove.mutateAsync();
      setIsDeleteOpen(false);
    } catch {
      /* Keep the dialog open so the user can retry or cancel. */
    }
  };

  return (
    <li className={styles.card}>
      <Link className={styles.main} to={`/checklists/${checklist.checklistId}`}>
        <span className={styles.copy}>
          <strong>{checklist.name}</strong>
          <span>{checklist.itemCount}개 항목</span>
        </span>
      </Link>
      <div className={styles.actions}>
        <Link className={styles.edit} to={`/checklists/${checklist.checklistId}`} aria-label={`${checklist.name} 편집`}>
          <Icon name="edit" size={14} />
        </Link>
        <button
          ref={deleteButtonRef}
          className={styles.deleteButton}
          type="button"
          aria-label={`${checklist.name} 삭제`}
          onClick={() => setIsDeleteOpen(true)}
        >
          <Icon name="trash" size={14} />
        </button>
      </div>
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title={`${checklist.name}을 삭제할까요?`}
        description={
          <>
            <p>
              {checklist.itemCount}개 항목과 매물 {checklist.assignedPropertyCount}곳의 활성 연결이 함께 삭제됩니다.
            </p>
            <p>매물에 적용된 체크 결과는 유지됩니다.</p>
          </>
        }
        confirmLabel="체크리스트 삭제"
        isConfirming={remove.isPending}
        returnFocusRef={deleteButtonRef}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={() => void deleteChecklist()}
      >
        {remove.isError && (
          <p className="form-error" role="alert">
            {getChecklistErrorMessage(remove.error)} 체크리스트는 그대로 유지됩니다.
          </p>
        )}
      </ConfirmDialog>
    </li>
  );
};

const styles = {
  card: css`
    label: ChecklistListCard-card;
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.5rem;
    min-height: 4.5rem;
    padding: 0.65rem 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
  `,

  main: css`
    label: ChecklistListCard-main;
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.55rem;
    color: var(--color-ink);
    text-decoration: none;

    &::after {
      position: absolute;
      inset: 0;
      border-radius: var(--radius-md);
      content: '';
    }

    &:focus-visible {
      outline: none;
    }

    &:focus-visible::after {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }

    & strong {
      font-size: 0.76rem;
      line-height: 1.35;
    }

    & span {
      margin-top: 0.15rem;
      color: var(--color-muted);
      font-size: 0.62rem;
      line-height: 1.45;
    }
  `,

  copy: css`
    label: ChecklistListCard-copy;

    &,
    & strong,
    & span {
      display: block;
      overflow-wrap: anywhere;
    }

    & {
      min-width: 0;
    }
  `,

  edit: css`
    label: ChecklistListCard-edit;
    position: relative;
    z-index: 1;
    display: inline-flex;
    width: 1.9rem;
    min-height: 1.9rem;
    align-items: center;
    justify-content: center;
    padding: 0;
    border-radius: 50%;
    background: var(--color-brand-100);
    color: var(--color-primary-dark);
    font: inherit;
    font-size: 0.8rem;
    font-weight: 800;
    text-decoration: none;

    &:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }
  `,

  actions: css`
    label: ChecklistListCard-actions;
    position: relative;
    z-index: 1;
    display: flex;
    gap: 0.28rem;
  `,

  deleteButton: css`
    label: ChecklistListCard-deleteButton;
    display: inline-grid;
    width: 1.9rem;
    min-height: 1.9rem;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: var(--color-error-surface);
    color: var(--color-error);
    cursor: pointer;
    place-items: center;

    &:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }
  `,
};

export default ChecklistListCard;
