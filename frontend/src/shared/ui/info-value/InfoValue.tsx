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
  /** block이면 입력 UI를 라벨 아래 줄 전체 폭으로 펼친다. 금액 두 칸이나 선택지처럼 한 줄에 다 들어가지 않는 입력에 쓴다. */
  editorLayout?: 'inline' | 'block';
  /** 값 아래 잠깐 보여 줄 짧은 응답(저장했어요 등). */
  feedback?: string;
};

/** 라벨과 값을 한 줄로 보여 주는 범용 UI. `onEdit`이 없으면 읽기 전용이다. */
const InfoValue = ({
  label,
  value,
  emptyText = '-',
  onEdit,
  editor,
  editorLayout = 'inline',
  feedback,
}: InfoValueProps) => {
  const isEmpty = value.trim() === '';
  const content = isEmpty ? emptyText : value;

  return (
    <div
      className={styles.row}
      data-editable={onEdit && !editor ? 'true' : undefined}
      data-editing={editor ? editorLayout : undefined}
    >
      <dt>{label}</dt>
      <dd className={styles.value} data-empty={(isEmpty && !editor) || undefined}>
        {editor ??
          (onEdit ? (
            // 이름을 "매물 이름 수정"으로만 두면 스크린 리더가 화면에 보이는 값을 읽지 않는다. 라벨과 값을 함께 담는다.
            <button
              className={styles.editButton}
              type="button"
              aria-label={`${label} ${isEmpty ? '비어 있음' : value}, 수정`}
              onClick={onEdit}
            >
              {content}
            </button>
          ) : (
            content
          ))}
        {feedback && !editor && (
          <span className={styles.feedback} role="status">
            {feedback}
          </span>
        )}
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

    /* 줄 전체 폭으로 펼친 입력은 칸마다 이름표를 달고 있어, 줄 라벨은 겹치지 않게 숨긴다. */
    &[data-editing='block'] > dt {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
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

    /* 줄 전체 폭으로 펼친 입력은 라벨 아래에 둔다. 입력 칸은 왼쪽부터 채운다. */
    [data-editing='block'] > & {
      grid-column: 1 / -1;
      text-align: left;
    }

    &[data-empty='true'] {
      color: var(--color-placeholder, #a8abb0);
      font-weight: 500;
    }
  `,

  feedback: css`
    label: InfoValue-feedback;
    display: block;
    margin-top: 0.15rem;
    color: var(--color-success, #2f9e5b);
    font-size: 0.72rem;
    font-weight: 600;
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
