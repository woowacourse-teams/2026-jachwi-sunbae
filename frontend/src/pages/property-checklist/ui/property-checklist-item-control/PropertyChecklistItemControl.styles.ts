import { css } from '@emotion/css';

export const item = css`
  label: PropertyChecklistItemControl-item;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);

  & fieldset {
    min-width: 0;
    margin: 0;
    padding: 0.75rem 0.7rem;
    border: 0;
  }
`;

export const content = css`
  label: PropertyChecklistItemControl-content;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(7.5rem, 0.72fr);
  gap: 0.55rem;
  align-items: center;

  & > strong {
    overflow-wrap: anywhere;
    font-size: 0.82rem;
    line-height: 1.45;
  }

  @media (max-width: 350px) {
    grid-template-columns: minmax(0, 1fr) minmax(7rem, 0.72fr);
  }
`;

export const statuses = css`
  label: PropertyChecklistItemControl-statuses;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.2rem;

  & label {
    display: grid;
    min-width: 0;
    justify-items: center;
    gap: 0.12rem;
    color: var(--color-check-good-ink);
    cursor: pointer;
  }

  & label[data-status='CAUTION'] {
    color: var(--color-check-caution-ink);
  }

  & label[data-status='UNCONFIRMED'] {
    color: var(--color-check-unconfirmed-ink);
  }

  & span {
    display: grid;
    width: 1.55rem;
    height: 1.55rem;
    border: 1px solid currentColor;
    border-radius: 50%;
    background: var(--color-surface);
    place-items: center;
  }

  & label:has(input:checked) span {
    background: currentColor;
  }

  & label:has(input:checked) span::after {
    color: var(--color-on-primary);
    content: '✓';
    font-size: 0.85rem;
    font-weight: 800;
  }

  & label:has(input:focus-visible) span {
    outline: 3px solid var(--color-focus);
    outline-offset: 2px;
  }

  & small {
    color: currentColor;
    font-size: 0.58rem;
    font-weight: 650;
    white-space: nowrap;
  }
`;

export const memoSummary = css`
  label: PropertyChecklistItemControl-memoSummary;
  display: flex;
  width: 100%;
  min-height: 2.25rem;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.35rem 0.55rem 0.35rem 0.7rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-muted);

  & p {
    min-width: 0;
    margin: 0;
    overflow: hidden;
    font-size: 0.68rem;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & button {
    display: grid;
    flex: 0 0 auto;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--color-ink-soft);
    cursor: pointer;
    place-items: center;
  }

  & button:disabled {
    cursor: default;
    opacity: 0.35;
  }
`;

export const memoPanel = css`
  label: PropertyChecklistItemControl-memoPanel;
  display: grid;
  gap: 0.5rem;
  padding: 0.55rem 0.7rem 0.7rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);

  & textarea {
    display: block;
    width: 100%;
    min-height: 3.5rem;
    resize: vertical;
    padding: 0.55rem 0.6rem;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    background: var(--color-canvas);
    color: var(--color-ink);
    font: inherit;
    font-size: 0.72rem;
    line-height: 1.45;
  }
`;

export const memoActions = css`
  label: PropertyChecklistItemControl-memoActions;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
`;

export const memoCancelButton = css`
  label: PropertyChecklistItemControl-memoCancelButton;
  min-height: 2.15rem;
  border: 0;
  border-radius: 999px;
  font: inherit;
  font-size: 0.7rem;
  font-weight: 750;
  cursor: pointer;
  background: var(--color-surface-muted);
  color: var(--color-ink-soft);

  &:disabled {
    cursor: wait;
    opacity: 0.62;
  }
`;

export const memoSaveButton = css`
  label: PropertyChecklistItemControl-memoSaveButton;
  min-height: 2.15rem;
  border: 0;
  border-radius: 999px;
  font: inherit;
  font-size: 0.7rem;
  font-weight: 750;
  cursor: pointer;
  background: var(--color-primary);
  color: var(--color-on-primary);

  &:disabled {
    cursor: wait;
    opacity: 0.62;
  }
`;

export const error = css`
  label: PropertyChecklistItemControl-error;
  margin: 0;
  padding: 0.55rem 0.7rem;
  background: var(--color-error-surface);
  color: var(--color-error);
  font-size: 0.7rem;
`;
