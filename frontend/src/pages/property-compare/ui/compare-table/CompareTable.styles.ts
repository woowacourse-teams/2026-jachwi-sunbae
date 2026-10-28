import { css, cx } from '@emotion/css';

export const table = css`
  label: CompareTable-table;
  --compare-table-columns: 1.1rem 2.5rem minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.3fr);
  display: grid;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: #fff;
`;

export const header = css`
  label: CompareTable-header;
  display: grid;
  grid-template-columns: var(--compare-table-columns);
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  padding-block: 0.65rem;
  background: #f3f4f7;
  color: var(--color-muted);
  font-size: 0.66rem;
  font-weight: 600;
`;

// 다른 요소의 선택자에서 `.CompareTable-row`로 가리킨다.
export const row = cx(
  css`
    label: CompareTable-row;
    display: grid;
    grid-template-columns: var(--compare-table-columns);
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    min-height: 3.5rem;
    cursor: pointer;
    transition: background-color 0.18s ease;

    /* 선택한 줄은 옅은 파란 바탕으로 표시한다. */
    &[data-selected='true'] {
      background: color-mix(in srgb, var(--color-brand-blue) 10%, transparent);
    }

    &:has(input:focus-visible) {
      outline: 2px solid var(--color-focus);
      outline-offset: -2px;
    }

    &:has(input:disabled) {
      cursor: not-allowed;
      opacity: 0.58;
    }
  `,
  'CompareTable-row',
);

export const rows = css`
  label: CompareTable-rows;
  margin: 0;
  padding: 0;
  list-style: none;

  & > li:nth-child(even) {
    background: #f9fafb;
  }
`;

export const checkmark = css`
  label: CompareTable-checkmark;
  display: grid;
  width: 1.1rem;
  height: 1.1rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 50%;
  background: #fff;
  color: var(--color-on-primary);
  place-items: center;

  .CompareTable-row[data-selected='true'] & {
    border-color: var(--color-brand-blue);
    background: var(--color-brand-blue);
  }
`;

export const thumbnail = css`
  label: CompareTable-thumbnail;
  display: grid;
  width: 2.5rem;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: var(--color-surface-disabled);
  place-items: center;

  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const cell = css`
  label: CompareTable-cell;
  overflow: hidden;
  color: var(--color-muted);
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;

  strong& {
    color: var(--color-ink);
    font-weight: 600;
  }
`;

export const noResult = css`
  label: CompareTable-noResult;
  padding: 1.5rem 1rem;
  color: var(--color-muted);
  font-size: 0.72rem;
  text-align: center;
`;
