import { css } from '@emotion/css';

export const card = css`
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
`;

export const main = css`
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
`;

export const copy = css`
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
`;

export const edit = css`
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
`;

export const actions = css`
  label: ChecklistListCard-actions;
  position: relative;
  z-index: 1;
  display: flex;
  gap: 0.28rem;
`;

export const deleteButton = css`
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
`;
