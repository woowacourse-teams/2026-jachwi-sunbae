import type { PropertyChecklistProgress } from '@/features/property/model/Property';

import * as styles from './ChecklistProgressRing.styles';

type ChecklistProgressRingProps = {
  progress: Pick<PropertyChecklistProgress, 'goodCount' | 'cautionCount' | 'unconfirmedCount'>;
};

const SIZE = 76;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** 조각 사이를 띄우는 길이. 둥근 끝이 양쪽으로 STROKE/2씩 나오므로 그만큼 더 뺀다. */
const GAP = 5;

/** 괜찮음·주의·미확인 비율을 고리로 보여주고, 오른쪽에 같은 색 막대와 개수를 세로로 놓는다. */
const ChecklistProgressRing = ({ progress }: ChecklistProgressRingProps) => {
  const results = [
    { key: 'GOOD', label: '괜찮음', count: progress.goodCount },
    { key: 'CAUTION', label: '주의', count: progress.cautionCount },
    { key: 'UNCONFIRMED', label: '미확인', count: progress.unconfirmedCount },
  ] as const;
  const total = results.reduce((sum, result) => sum + result.count, 0);
  const filled = results.filter((result) => result.count > 0);

  let start = 0;
  const segments = filled.map((result) => {
    const length = (CIRCUMFERENCE * result.count) / total;
    const segment = { ...result, offset: start, length };
    start += length;
    return segment;
  });

  return (
    <div className={styles.summary}>
      <svg className={styles.ring} width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        {segments.length <= 1 ? (
          // 한 가지 결과만 있으면 이어진 고리 하나로 그린다. 아직 항목이 없으면 미확인 색으로 비워 둔다.
          <circle
            data-status={segments[0]?.key ?? 'UNCONFIRMED'}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE}
          />
        ) : (
          segments.map((segment) => (
            <circle
              key={segment.key}
              data-status={segment.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${Math.max(segment.length - GAP - STROKE, 0.01)} ${CIRCUMFERENCE}`}
              // 12시 방향에서 시계 방향으로 이어 붙인다. 둥근 끝이 앞 조각과 닿지 않게 반 칸 밀어 둔다.
              strokeDashoffset={-(segment.offset + (GAP + STROKE) / 2)}
            />
          ))
        )}
      </svg>
      <ul className={styles.legend} aria-label="체크리스트 진행 결과 집계">
        {results.map((result) => (
          <li key={result.key} data-status={result.key} data-empty={result.count === 0 || undefined}>
            <span>{result.label}</span>
            <strong>{result.count}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChecklistProgressRing;
