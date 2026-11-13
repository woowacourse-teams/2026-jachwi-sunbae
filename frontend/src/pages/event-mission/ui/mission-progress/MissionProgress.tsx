import { css, cx } from '@emotion/css';

import { EVENT_PRIZE } from '@/features/event-mission/model/eventMissions';

import { formatCompletedAt } from '../../lib/formatCompletedAt';

type MissionProgressProps = {
  completedCount: number;
  totalCount: number;
  /** 마지막 미션을 마친 시각. 다 마치기 전에는 `null`이다. */
  allCompletedAt: number | null;
  memberId: number;
};

/**
 * 현황판 위쪽의 진행률과 상품 안내. 미션을 모두 마치면 노란 완료 카드로 바뀌어, 운영진이 한눈에 확인하도록
 * 완료 문구와 회원 번호, 마친 시각을 크게 보여 준다.
 */
const MissionProgress = ({ completedCount, totalCount, allCompletedAt, memberId }: MissionProgressProps) => {
  const isAllCompleted = allCompletedAt !== null;
  return (
    <section className={cx(styles.card, isAllCompleted && styles.cardCompleted)} aria-labelledby="event-mission-title">
      <div className={styles.text}>
        <h1 id="event-mission-title" className={styles.eyebrow}>
          이벤트 미션
        </h1>
        {isAllCompleted ? (
          <p className={styles.headline} role="status">
            <strong>미션 완료!</strong>
            <span>운영진에게 이 화면을 보여 주세요</span>
          </p>
        ) : (
          <p className={styles.headline}>
            <span>{`미션 ${totalCount}개를 모두 끝내면 추첨을 통해 ${EVENT_PRIZE.name}을 드려요`}</span>
          </p>
        )}
      </div>
      <p className={styles.count}>
        <strong>{completedCount}</strong>
        <span>{`/ ${totalCount}`}</span>
      </p>
      <div
        className={styles.track}
        role="progressbar"
        aria-label="미션 진행률"
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-valuenow={completedCount}
      >
        <span className={styles.fill} style={{ width: `${(completedCount / totalCount) * 100}%` }} />
      </div>
      {isAllCompleted ? (
        <dl className={styles.proof}>
          <div>
            <dt>회원 번호</dt>
            <dd>{memberId}</dd>
          </div>
          <div>
            <dt>완료 시각</dt>
            <dd>{formatCompletedAt(allCompletedAt)}</dd>
          </div>
        </dl>
      ) : (
        <p className={styles.prize}>{`상품: ${EVENT_PRIZE.name} (준비 수량 ${EVENT_PRIZE.count}개)`}</p>
      )}
    </section>
  );
};

const styles = {
  /* 위 줄은 문구와 숫자, 아래로 진행 막대와 상품 안내를 둔다. */
  card: css`
    label: MissionProgress-card;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.5rem 1rem;
    padding: 0.9rem 1rem;
    border-radius: var(--radius-card);
    /* 홈의 이벤트 배너와 같은 옅은 파랑에서 노랑으로 넘어가는 바탕에 진한 파랑 글자를 쓴다. */
    background: linear-gradient(
      100deg,
      color-mix(in srgb, var(--color-brand-blue) 22%, #fff) 0%,
      color-mix(in srgb, var(--color-brand-blue) 10%, #fff) 55%,
      color-mix(in srgb, var(--color-brand-yellow) 40%, #fff) 100%
    );
    color: var(--color-brand-blue-ink);
  `,

  cardCompleted: css`
    label: MissionProgress-cardCompleted;
    background: var(--color-brand-yellow);
    color: var(--color-ink);
  `,

  text: css`
    label: MissionProgress-text;
    display: grid;
    gap: 0.2rem;
    min-width: 0;
  `,

  eyebrow: css`
    label: MissionProgress-eyebrow;
    margin: 0;
    font-size: 0.74rem;
    font-weight: 700;
    opacity: 0.85;
  `,

  headline: css`
    label: MissionProgress-headline;
    display: grid;
    gap: 0.1rem;
    margin: 0;
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1.35;
    letter-spacing: -0.02em;
    word-break: keep-all;

    & strong {
      font-size: 1.4rem;
      line-height: 1.2;
    }
  `,

  count: css`
    label: MissionProgress-count;
    display: flex;
    align-items: baseline;
    gap: 0.2rem;
    margin: 0;
    font-weight: 700;
    font-variant-numeric: tabular-nums;

    & strong {
      font-size: 2rem;
      line-height: 1;
    }

    & span {
      font-size: 1rem;
      opacity: 0.8;
    }
  `,

  track: css`
    label: MissionProgress-track;
    grid-column: 1 / -1;
    height: 0.4rem;
    overflow: hidden;
    border-radius: 999px;
    background: color-mix(in srgb, currentColor 22%, transparent);
  `,

  fill: css`
    label: MissionProgress-fill;
    display: block;
    height: 100%;
    border-radius: inherit;
    background: currentColor;
    transition: width 0.3s ease;

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `,

  prize: css`
    label: MissionProgress-prize;
    grid-column: 1 / -1;
    margin: 0;
    font-size: 0.74rem;
    font-weight: 600;
    opacity: 0.9;
  `,

  proof: css`
    label: MissionProgress-proof;
    display: flex;
    grid-column: 1 / -1;
    flex-wrap: wrap;
    gap: 0.3rem 1.5rem;
    margin: 0;

    & dt {
      font-size: 0.7rem;
      font-weight: 600;
      opacity: 0.75;
    }

    & dd {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
  `,
};

export default MissionProgress;
