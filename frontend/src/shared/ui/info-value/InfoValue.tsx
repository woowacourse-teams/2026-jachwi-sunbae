import { css } from '@emotion/css';
import type { ReactNode } from 'react';

export type InfoValueProps = {
  label: string;
  value: string;
  /** 값이 비었을 때 흐리게 보여 줄 문구. */
  emptyText?: string;
  /** 넘기면 줄 전체를 눌러 이 값을 고칠 수 있다. */
  onEdit?: () => void;
  /** 넘기면 값 자리에 이 입력 UI를 그 줄 안에서 바로 보여 준다. */
  editor?: ReactNode;
};

/** 라벨과 값을 한 줄로 보여 주는 범용 UI. `onEdit`이 없으면 읽기 전용이다. */
const InfoValue = ({ label, value, emptyText = '-', onEdit, editor }: InfoValueProps) => {
  const isEmpty = value.trim() === '';
  const content = isEmpty ? emptyText : value;

  return (
    <div className={styles.row} data-editable={onEdit && !editor ? 'true' : undefined}>
      <dt>{label}</dt>
      <dd className={styles.value} data-empty={(isEmpty && !editor) || undefined}>
        {editor ??
          (onEdit ? (
            <button className={styles.editButton} type="button" aria-label={`${label} 수정`} onClick={onEdit}>
              {content}
            </button>
          ) : (
            content
          ))}
      </dd>
    </div>
  );
};

const styles = {
  row: css`
    label: InfoValue-row;
    display: grid;
    grid-template-columns: 6.5rem minmax(0, 1fr);
    gap: 0.65rem;
    align-items: center;
    padding: 0.65rem 0;

    &[data-editable='true'] {
      position: relative;
      border-radius: var(--radius-sm, 0.5rem);
      cursor: pointer;
    }

    &[data-editable='true']:hover {
      background: var(--color-canvas, #f7f8fa);
    }

    & dt {
      margin: 0;
      color: var(--color-muted, #868b94);
      font-size: 0.82rem;
      font-weight: 400;
      line-height: 1.5;
    }

    & dd {
      margin: 0;
      overflow-wrap: anywhere;
      color: var(--color-ink, #212124);
      font-size: 0.85rem;
      font-weight: 400;
      line-height: 1.5;
      text-align: center;
    }
  `,

  value: css`
    label: InfoValue-value;

    &[data-empty='true'] {
      color: var(--color-placeholder, #a8abb0);
      font-weight: 500;
    }
  `,

  /* 값 버튼의 누르는 영역을 줄 전체로 넓힌다. */
  editButton: css`
    label: InfoValue-editButton;
    border: 0;
    padding: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: inherit;
    cursor: pointer;

    &::after {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      content: '';
    }

    &:focus-visible {
      outline: none;
    }

    &:focus-visible::after {
      outline: 2px solid var(--color-primary, #2f80ed);
      outline-offset: -2px;
    }
  `,
};

export default InfoValue;
