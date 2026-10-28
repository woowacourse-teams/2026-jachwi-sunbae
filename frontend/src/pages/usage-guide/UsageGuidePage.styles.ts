import { css } from '@emotion/css';

export const page = css`
  label: UsageGuidePage-page;
  min-height: 100%;
  background: var(--color-canvas);
  color: var(--color-ink);
`;

export const container = css`
  label: UsageGuidePage-container;
  width: min(100%, 56rem);
  margin: 0 auto;
  padding: 0 var(--page-inline-padding) 0;
`;

export const introduction = css`
  label: UsageGuidePage-introduction;

  & p {
    margin: 0 0 1.25rem;
    color: var(--color-ink-soft);
    font-size: 0.9rem;
    line-height: 1.5;
  }
`;

export const recordNotice = css`
  label: UsageGuidePage-recordNotice;
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);

  & h2 {
    margin: 0 0 0.6rem;
    font-size: 0.9rem;
  }

  & ul {
    display: grid;
    gap: 0.4rem;
    margin: 0;
    padding-left: 1.1rem;
    color: var(--color-ink-soft);
    font-size: 0.78rem;
    line-height: 1.5;
  }
`;

export const actions = css`
  label: UsageGuidePage-actions;
  position: sticky;
  bottom: 0;
  margin: 0 calc(var(--page-inline-padding) * -1);
  padding: 0.75rem var(--page-inline-padding) max(0.75rem, env(safe-area-inset-bottom));
  background: linear-gradient(to bottom, rgb(255 255 255 / 0%), var(--color-canvas) 1rem);

  @media (min-width: 48rem) {
    position: static;
    max-width: 20rem;
    margin: 0;
    padding-inline: 0;
    background: none;
  }
`;
