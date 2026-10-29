import { css } from '@emotion/css';

export const section = css`
  label: MealContent-section;
  padding: 1.4rem 1.25rem 2rem;
  max-width: 45rem;
  margin: auto;
  & h2 {
    margin: 0 0 0.5rem;
    font-size: 1.35rem;
    letter-spacing: -0.035em;
  }
  & p {
    line-height: 1.6;
  }
`;
export const description = css`
  label: MealContent-description;
  color: var(--color-ink-soft);
  font-size: 0.85rem;
  margin: 0 0 1.25rem;
`;
export const filters = css`
  label: MealContent-filters;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 1rem 0;
  & button {
    min-height: 44px;
    padding: 0.5rem 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: 99px;
    background: var(--color-surface);
    color: var(--color-ink-soft);
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
  }
  & button[aria-pressed='true'] {
    border-color: var(--color-action);
    background: var(--color-action);
    color: var(--color-on-action);
    font-weight: 700;
  }
`;
export const note = css`
  label: MealContent-note;
  color: var(--color-ink-soft);
  font-size: 0.78rem;
  line-height: 1.7;
  margin-top: 1.25rem;
  padding: 1rem;
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  overflow-wrap: anywhere;
  & p {
    margin: 0.4rem 0;
  }
  & a {
    color: var(--color-primary);
    text-underline-offset: 0.2em;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }
`;
export const facts = css`
  label: MealContent-facts;
  display: grid;
  gap: 1rem;
  margin: 1.3rem 0;
  & div {
    display: grid;
    grid-template-columns: 6.5rem minmax(0, 1fr);
    gap: 0.6rem;
    font-size: 0.86rem;
    line-height: 1.6;
  }
  & dt {
    color: var(--color-ink-soft);
  }
  & dd {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
`;
export const empty = css`
  label: MealContent-empty;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-ink-soft);
  line-height: 1.7;
`;
export const badge = css`
  label: MealContent-badge;
  display: inline-flex;
  width: fit-content;
  padding: 0.3rem 0.6rem;
  border-radius: 0.4rem;
  font-size: 0.75rem;
  font-weight: 800;
  background: color-mix(in srgb, var(--color-brand-yellow) 24%, white);
  color: var(--color-ink);
`;
