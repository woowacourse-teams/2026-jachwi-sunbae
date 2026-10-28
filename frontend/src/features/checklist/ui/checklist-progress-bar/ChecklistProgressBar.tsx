import { css, cx } from '@emotion/css';
import type { ReactNode } from 'react';

import type { PropertyChecklistProgress } from '@/features/property/model/Property';

type ChecklistProgressBarProps = {
  progress: Pick<PropertyChecklistProgress, 'goodCount' | 'cautionCount' | 'unconfirmedCount'>;
  compact?: boolean;
  /** 범례와 같은 줄의 오른쪽 끝에 붙일 내용. */
  trailing?: ReactNode;
};

const ChecklistProgressBar = ({ progress, compact = false, trailing }: ChecklistProgressBarProps) => {
  const results = [
    {
      label: '괜찮음',
      count: progress.goodCount,
      segmentClassName: styles.goodSegment,
      itemClassName: styles.goodResult,
    },
    {
      label: '주의',
      count: progress.cautionCount,
      segmentClassName: styles.cautionSegment,
      itemClassName: styles.cautionResult,
    },
    {
      label: '미확인',
      count: progress.unconfirmedCount,
      segmentClassName: styles.unconfirmedSegment,
      itemClassName: undefined,
    },
  ];

  return (
    <div className={styles.results} data-compact={compact || undefined}>
      <div className={styles.bar} aria-hidden="true">
        {results
          .filter((result) => result.count > 0)
          .map((result) => (
            <span key={result.label} className={result.segmentClassName} style={{ flexGrow: result.count }} />
          ))}
      </div>
      <div className={styles.legend}>
        <ul aria-label="체크리스트 진행 결과 집계">
          {results.map((result) => (
            <li key={result.label} className={result.itemClassName} data-empty={result.count === 0 || undefined}>
              <span className={styles.resultText}>
                {result.label}{' '}
                <strong className={result.count > 0 ? styles.activeCount : undefined}>{result.count}</strong>
              </span>
            </li>
          ))}
        </ul>
        {trailing !== undefined && <span className={styles.trailing}>{trailing}</span>}
      </div>
    </div>
  );
};

const styles = {
  // 다른 요소의 선택자에서 `.ChecklistProgressBar-results`로 가리킨다.
  results: cx(
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
  ),

  bar: css`
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
  `,

  goodSegment: css`
    label: ChecklistProgressBar-goodSegment;
    background: var(--color-check-good);
  `,

  cautionSegment: css`
    label: ChecklistProgressBar-cautionSegment;
    background: var(--color-check-caution);
  `,

  unconfirmedSegment: css`
    label: ChecklistProgressBar-unconfirmedSegment;
    background: var(--color-check-unconfirmed);
  `,

  legend: css`
    label: ChecklistProgressBar-legend;
    display: flex;
    min-width: 0;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  `,

  trailing: css`
    label: ChecklistProgressBar-trailing;
    flex: 0 0 auto;
  `,

  goodResult: css`
    label: ChecklistProgressBar-goodResult;

    .ChecklistProgressBar-results &::before {
      background: var(--color-check-good);
    }
  `,

  cautionResult: css`
    label: ChecklistProgressBar-cautionResult;

    .ChecklistProgressBar-results &::before {
      background: var(--color-check-caution);
    }
  `,

  resultText: css`
    label: ChecklistProgressBar-resultText;
    display: inline-flex;
    gap: 0.18rem;
  `,

  activeCount: css`
    label: ChecklistProgressBar-activeCount;
    color: var(--color-ink);
  `,
};

export default ChecklistProgressBar;
