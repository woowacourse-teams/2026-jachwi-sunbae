import { css } from '@emotion/css';

export const form = css`
  label: StreetMemoForm-form;
  display: grid;
  gap: 1rem;
`;

export const preferences = css`
  label: StreetMemoForm-preferences;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  border: 0;

  & legend {
    margin-bottom: 0.5rem;
    color: var(--color-ink-soft);
    font-size: 0.875rem;
    font-weight: 650;
  }
`;

export const preference = css`
  label: StreetMemoForm-preference;
  min-height: 3rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.75rem;
  background: var(--color-surface);
  color: var(--color-ink);
  font-size: 0.9375rem;
  font-weight: 700;
  cursor: pointer;

  &[aria-pressed='true'][data-preference='LIKE'] {
    border-color: var(--color-brand-blue);
    background: var(--color-brand-blue);
    color: #fff;
  }

  &[aria-pressed='true'][data-preference='DISLIKE'] {
    border-color: var(--color-danger);
    background: var(--color-danger);
    color: #fff;
  }
`;

export const memo = css`
  label: StreetMemoForm-memo;
  min-height: 6rem;
  resize: vertical;
`;

export const error = css`
  label: StreetMemoForm-error;
  margin: 0;
  color: var(--color-danger);
  font-size: 0.875rem;
`;

export const actions = css`
  label: StreetMemoForm-actions;
  display: flex;
  gap: 0.5rem;

  & > * {
    flex: 1;
  }
`;
