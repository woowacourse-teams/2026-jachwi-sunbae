import { css } from '@emotion/css';

export const dialog = css`
  label: ConfirmDialog-dialog;
  position: fixed;
  inset: 1rem;
  box-sizing: border-box;
  width: min(calc(100vw - 2rem), 460px);
  max-width: calc(100vw - 2rem);
  max-height: calc(100svh - 2rem);
  margin: auto;
  padding: 1.25rem;
  overflow-y: auto;
  overflow-wrap: anywhere;
  overscroll-behavior: contain;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-ink);

  &::backdrop {
    background: var(--color-overlay);
    backdrop-filter: blur(2px);
  }

  & h2 {
    margin: 0;
    overflow-wrap: anywhere;
    font-size: 1.3rem;
  }

  & ul {
    padding-left: 1.2rem;
    line-height: 1.7;
  }
`;

export const description = css`
  label: ConfirmDialog-description;
  min-width: 0;
  color: var(--color-ink-soft);
  line-height: 1.55;
`;

export const actions = css`
  label: ConfirmDialog-actions;
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
  margin-top: 1rem;

  & > * {
    min-width: 0;
  }
`;

export const photo = css`
  label: ConfirmDialog-photo;
  max-height: 15rem;
`;
