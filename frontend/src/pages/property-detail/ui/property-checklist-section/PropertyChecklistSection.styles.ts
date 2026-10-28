import { css } from '@emotion/css';

export const count = css`
  label: PropertyChecklistSection-count;
  color: var(--color-primary-dark);
  font-size: 0.78rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

export const retry = css`
  label: PropertyChecklistSection-retry;
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  margin: 0;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-muted);
  font: inherit;
  font-size: 0.72rem;
  cursor: pointer;
`;

export const mainAction = css`
  label: PropertyChecklistSection-mainAction;
  gap: 0.4rem;
  margin-top: 0.9rem;
`;

export const contractSection = css`
  label: PropertyChecklistSection-contractSection;
  margin: 0 calc(-1 * var(--page-inline-padding));
  padding: 0.8rem var(--page-inline-padding);
  border-top: 0.5rem solid var(--color-canvas);
  background: var(--color-surface);
`;

export const contractAction = css`
  label: PropertyChecklistSection-contractAction;
  gap: 0.4rem;
`;

export const loading = css`
  label: PropertyChecklistSection-loading;
  margin: 0.9rem 0 0;
  color: var(--color-muted);
  font-size: 0.8rem;
`;

export const expandedChecklist = css`
  label: PropertyChecklistSection-expandedChecklist;
  display: grid;
  gap: 0.75rem;
  margin-top: 0.9rem;
`;

export const expandedHeader = css`
  label: PropertyChecklistSection-expandedHeader;
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 0.75rem;

  & span {
    color: var(--color-muted);
    font-size: 0.7rem;
  }

  & h3 {
    margin: 0.2rem 0 0;
    font-size: 1rem;
  }

  & > strong {
    color: var(--color-primary-dark);
    font-size: 0.82rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
`;

export const items = css`
  label: PropertyChecklistSection-items;
  display: grid;
  gap: 0.55rem;
  margin: 0;
  padding: 0;
  list-style: none;
`;
