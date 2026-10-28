import { css, cx } from '@emotion/css';

// 다른 요소의 선택자에서 `.ChecklistProgressBar-results`로 가리킨다.
export const results = cx(
  css`
    label: ChecklistProgressBar-results;
    display: grid;
    gap: 0.65rem;
    margin-top: 0.9rem;

    &[data-compact='true'] {
      gap: 0.3rem;
      margin-top: 0.3rem;
    }

    & ul {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: 0.45rem 0.75rem;
      margin: 0;
      padding: 0;
      font-size: 0.7rem;
      font-weight: 750;
      list-style: none;
    }

    &[data-compact='true'] ul {
      display: flex;
      min-width: 0;
      grid-auto-flow: column;
      grid-auto-columns: max-content;
      gap: 0.25rem 0.55rem;
      font-size: 0.64rem;
      flex-wrap: nowrap;
    }

    &[data-compact='true'] li {
      flex: 0 0 auto;
      white-space: nowrap;
    }

    & li {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      color: var(--color-ink-soft);
    }

    & li::before {
      width: 3px;
      height: 0.75rem;
      flex: 0 0 auto;
      border-radius: 1px;
      background: var(--color-check-unconfirmed);
      content: '';
    }

    &[data-compact='true'] li::before {
      height: 0.58rem;
    }

    & li[data-empty='true']::before {
      opacity: 0.45;
    }

    & li strong {
      color: var(--color-muted);
      font-size: inherit;
      font-weight: 850;
    }
  `,
  'ChecklistProgressBar-results',
);

export const bar = css`
  label: ChecklistProgressBar-bar;
  display: flex;
  width: 100%;
  height: 0.42rem;
  gap: 2px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-border);

  .ChecklistProgressBar-results[data-compact='true'] & {
    height: 0.3rem;
  }

  & > span {
    min-width: 0;
    flex-basis: 0;
  }

  & > span:first-child {
    border-radius: 999px 0 0 999px;
  }

  & > span:last-child {
    border-radius: 0 999px 999px 0;
  }
`;

export const goodSegment = css`
  label: ChecklistProgressBar-goodSegment;
  background: var(--color-check-good);
`;

export const cautionSegment = css`
  label: ChecklistProgressBar-cautionSegment;
  background: var(--color-check-caution);
`;

export const unconfirmedSegment = css`
  label: ChecklistProgressBar-unconfirmedSegment;
  background: var(--color-check-unconfirmed);
`;

export const legend = css`
  label: ChecklistProgressBar-legend;
  display: flex;
  min-width: 0;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const trailing = css`
  label: ChecklistProgressBar-trailing;
  flex: 0 0 auto;
`;

export const goodResult = css`
  label: ChecklistProgressBar-goodResult;

  .ChecklistProgressBar-results &::before {
    background: var(--color-check-good);
  }
`;

export const cautionResult = css`
  label: ChecklistProgressBar-cautionResult;

  .ChecklistProgressBar-results &::before {
    background: var(--color-check-caution);
  }
`;

export const resultText = css`
  label: ChecklistProgressBar-resultText;
  display: inline-flex;
  gap: 0.18rem;
`;

export const activeCount = css`
  label: ChecklistProgressBar-activeCount;
  color: var(--color-ink);
`;
