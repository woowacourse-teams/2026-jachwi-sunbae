import { css } from '@emotion/css';

export const item = css`
  label: PropertyChecklistItemControl-item;

  /* 묶음 안의 행 사이에는 얇은 선만 둔다. 좌우 여백은 묶음이 준다. */
  & + & {
    border-top: 1px solid color-mix(in srgb, var(--color-border-strong) 70%, transparent);
  }
`;

export const row = css`
  label: PropertyChecklistItemControl-row;
  display: flex;
  min-height: 3.4rem;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0;
`;

export const question = css`
  label: PropertyChecklistItemControl-question;
  display: grid;
  flex: 1 1 auto;
  min-width: 0;
  gap: 0.2rem;

  & > strong {
    overflow-wrap: anywhere;
    font-size: 0.86rem;
    font-weight: 700;
    line-height: 1.4;
  }
`;

export const memoText = css`
  label: PropertyChecklistItemControl-memoText;
  margin: 0;
  overflow: hidden;
  color: var(--color-muted);
  font-size: 0.72rem;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const statuses = css`
  label: PropertyChecklistItemControl-statuses;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.3rem;

  /* 고르지 않은 칩은 테두리 없이 옅게 채우고, 고르면 상태 색으로 물들인다. 회색 표면(디자인 셸) 위에서도 보이게 표면색에 섞는다. */
  & > button[data-status] {
    min-width: 3.2rem;
    min-height: 2.1rem;
    padding: 0 0.7rem;
    border: 0;
    border-radius: 0.6rem;
    background: color-mix(in srgb, var(--color-ink) 7%, var(--color-surface));
    color: var(--color-ink);
    font: inherit;
    font-size: 0.74rem;
    font-weight: 650;
    white-space: nowrap;
    cursor: pointer;
  }

  & > button[data-status='GOOD'][aria-pressed='true'] {
    background: color-mix(in srgb, var(--color-check-good-ink) 14%, var(--color-surface));
    color: var(--color-check-good-ink);
    font-weight: 750;
  }

  & > button[data-status='CAUTION'][aria-pressed='true'] {
    background: color-mix(in srgb, var(--color-check-caution-ink) 14%, var(--color-surface));
    color: var(--color-check-caution-ink);
    font-weight: 750;
  }

  & > button:focus-visible {
    outline: 3px solid var(--color-focus);
    outline-offset: 2px;
  }

  & > button:disabled {
    cursor: wait;
  }
`;

export const memoButton = css`
  label: PropertyChecklistItemControl-memoButton;
  display: grid;
  width: 2.1rem;
  height: 2.1rem;
  margin-left: 0.1rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-ink-soft);
  cursor: pointer;
  place-items: center;

  &:disabled {
    cursor: default;
    opacity: 0.35;
  }
`;

export const memoPanel = css`
  label: PropertyChecklistItemControl-memoPanel;
  display: grid;
  gap: 0.35rem;
  /* 메모는 같은 행 안에서 질문 아래로 펼쳐지므로 구분선 없이 이어 붙인다. */
  padding: 0 0 0.75rem;

  /* 따로 뜬 폼처럼 보이지 않게 칩과 같은 옅은 바탕만 깔고, 글이 늘면 높이가 따라 늘어난다. */
  & textarea {
    display: block;
    width: 100%;
    min-height: 2.6rem;
    max-height: 8rem;
    field-sizing: content;
    resize: none;
    padding: 0.6rem 0.7rem;
    border: 0;
    border-radius: 0.6rem;
    background: color-mix(in srgb, var(--color-ink) 5%, var(--color-surface));
    color: var(--color-ink);
    font: inherit;
    font-size: 0.8rem;
    line-height: 1.45;
    outline: none;
  }

  /* 테두리를 그리지 않고 바탕을 조금 진하게 해 입력 중임을 보인다. 전역 포커스 테두리도 여기서는 끈다. */
  & textarea:focus,
  & textarea:focus-visible {
    outline: none;
    background: color-mix(in srgb, var(--color-ink) 9%, var(--color-surface));
  }

  & textarea::placeholder {
    color: var(--color-muted);
  }
`;

export const memoActions = css`
  label: PropertyChecklistItemControl-memoActions;
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
`;

const memoTextButton = `
  min-height: 2rem;
  padding: 0 0.6rem;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  font: inherit;
  font-size: 0.76rem;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.5;
  }
`;

export const memoCancelButton = css`
  label: PropertyChecklistItemControl-memoCancelButton;
  ${memoTextButton}
  color: var(--color-muted);
  font-weight: 600;
`;

export const memoSaveButton = css`
  label: PropertyChecklistItemControl-memoSaveButton;
  ${memoTextButton}
  color: var(--color-ink);
  font-weight: 800;
`;

export const error = css`
  label: PropertyChecklistItemControl-error;
  margin: 0;
  padding: 0.55rem 0.7rem;
  background: var(--color-error-surface);
  color: var(--color-error);
  font-size: 0.7rem;
`;
