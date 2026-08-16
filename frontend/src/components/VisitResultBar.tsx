import type { VisitSummary } from '../types/Visit';
import Icon from './ui/Icon';
import styles from './VisitResultBar.module.css';

type VisitResultBarProps = {
  summary: VisitSummary;
};

const VisitResultBar = ({ summary }: VisitResultBarProps) => {
  const results = [
    {
      label: '괜찮음',
      count: summary.goodCount,
      iconName: 'check-circle' as const,
      segmentClassName: styles.goodSegment,
      itemClassName: styles.goodResult,
    },
    {
      label: '주의',
      count: summary.cautionCount,
      iconName: 'warning-triangle' as const,
      segmentClassName: styles.cautionSegment,
      itemClassName: styles.cautionResult,
    },
    {
      label: '미확인',
      count: summary.unconfirmedCount,
      iconName: 'pending-circle' as const,
      segmentClassName: styles.unconfirmedSegment,
      itemClassName: styles.unconfirmedResult,
    },
  ];

  return (
    <div className={styles.results}>
      <div className={styles.bar} aria-hidden="true">
        {results
          .filter((result) => result.count > 0)
          .map((result) => (
            <span key={result.label} className={result.segmentClassName} style={{ flexGrow: result.count }} />
          ))}
      </div>
      <ul aria-label="최근 방문 결과 집계">
        {results.map((result) => (
          <li key={result.label} className={result.itemClassName}>
            <span className={styles.iconBadge} aria-hidden="true">
              <Icon name={result.iconName} size={12} />
            </span>
            <span className={styles.resultText}>
              {result.label} <strong>{result.count}</strong>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VisitResultBar;
