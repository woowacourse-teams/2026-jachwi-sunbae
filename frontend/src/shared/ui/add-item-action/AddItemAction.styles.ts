import { css } from '@emotion/css';

export const action = css`
  label: AddItemAction-action;
  min-height: 2.95rem;
  border: 1px dashed var(--color-border-strong);
  background: var(--color-surface);
  color: var(--color-ink-soft);
  font-size: 0.8rem;

  &:hover:not(:disabled) {
    border-color: var(--color-muted);
    background: var(--color-surface-neutral);
    color: var(--color-ink);
  }
`;
