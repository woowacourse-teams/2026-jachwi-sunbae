import { css } from '@emotion/css';

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

export const loading = css`
  label: PropertyChecklistSection-loading;
  margin: 0.9rem 0 0;
  color: var(--color-muted);
  font-size: 0.8rem;
`;

export const expandedChecklist = css`
  label: PropertyChecklistSection-expandedChecklist;
  /* 체크리스트 이름과 항목을 둥근 묶음 하나에 담는다. 항목은 카드로 띄우지 않고 줄로만 나눈다. */
  margin-top: 0.9rem;
  padding: 0.95rem 1rem 0.2rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
`;

export const expandedHeader = css`
  label: PropertyChecklistSection-expandedHeader;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 0.2rem;

  & h3 {
    min-width: 0;
    margin: 0;
    font-size: 1.05rem;
    font-weight: 800;
  }

  & > span {
    flex: 0 0 auto;
    color: var(--color-muted);
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
`;

export const items = css`
  label: PropertyChecklistSection-items;
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
`;
