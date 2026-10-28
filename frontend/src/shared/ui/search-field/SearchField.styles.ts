import { css } from '@emotion/css';

export const search = css`
  label: SearchField-search;
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  min-height: 2.5rem;
  align-items: center;
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:focus-within {
    border-color: var(--color-ink, #212124);
  }

  & input {
    width: 100%;
    min-width: 0;
    min-height: 2.4rem;
    padding: 0.55rem 0.5rem;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--color-ink);
    font: inherit;
  }

  & input::placeholder {
    color: var(--color-placeholder);
  }
`;

export const pill = css`
  label: SearchField-pill;
  border-radius: 999px;
`;

export const withoutSubmit = css`
  label: SearchField-withoutSubmit;
  grid-template-columns: auto minmax(0, 1fr) auto;
`;

export const searchIcon = css`
  label: SearchField-searchIcon;
  margin-left: 0.85rem;
  color: var(--color-ink);
`;

export const backButton = css`
  label: SearchField-backButton;
  display: grid;
  width: 2.35rem;
  height: 2.35rem;
  margin-left: 0.25rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-ink);
  cursor: pointer;
  place-items: center;
`;

export const clear = css`
  label: SearchField-clear;
  min-width: 2.75rem;
  min-height: 2.35rem;
  border: 0;
  background: transparent;
  color: var(--color-ink);
  cursor: pointer;
  display: grid;
  place-items: center;
`;

export const submit = css`
  label: SearchField-submit;
  min-width: 2.75rem;
  min-height: 2.35rem;
  border: 0;
  background: transparent;
  color: var(--color-ink);
  cursor: pointer;
  padding: 0 0.85rem 0 0.4rem;
  font-weight: 800;
`;

export const srOnly = css`
  label: SearchField-srOnly;
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
