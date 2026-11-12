import { css, cx } from '@emotion/css';
import { Link } from 'react-router-dom';

import Icon from '@/shared/ui/icon/Icon';

import type { EventMissionBoardItem } from '../../hooks/useEventMissionBoard';
import { formatCompletedAt } from '../../lib/formatCompletedAt';

const CheckMark = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
    <path d="M3.5 8.4 6.6 11.5 12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * 미션 한 개. 마친 미션은 체크 표시와 마친 시각을 보여 주고, 아직 하지 않은 미션은 카드 전체가 그 기능 화면으로 가는 링크다.
 * 단계가 둘 이상인 미션은 마칠 때까지 단계별 진행을 함께 보여 준다.
 */
const MissionCard = ({ mission, completedAt, steps }: EventMissionBoardItem) => {
  const isCompleted = completedAt !== null;
  const body = (
    <>
      <span className={cx(styles.badge, isCompleted && styles.badgeCompleted)} aria-hidden="true">
        {isCompleted ? <CheckMark /> : mission.number}
      </span>
      <span className={styles.text}>
        <strong className={styles.title}>
          <span className="sr-only">{`미션 ${mission.number}.`}</span> {mission.title}
        </strong>
        {mission.hint && <span className={styles.hint}>{mission.hint}</span>}
        {!isCompleted && steps.length > 1 && (
          <span className={styles.steps}>
            {steps.map(({ step, label, isDone }) => (
              <span key={step} className={cx(styles.step, isDone && styles.stepDone)}>
                {isDone && <CheckMark />}
                {label} <span className="sr-only">{isDone ? '완료' : '미완료'}</span>
              </span>
            ))}
          </span>
        )}
        {isCompleted && <span className={styles.completed}>{`완료 ${formatCompletedAt(completedAt)}`}</span>}
      </span>
      {!isCompleted && (
        <span className={styles.action}>
          <span className="sr-only">{mission.actionLabel}</span>
          <Icon name="chevron-right" size={18} />
        </span>
      )}
    </>
  );

  return (
    <li className={styles.item}>
      {isCompleted ? (
        <div className={cx(styles.card, styles.cardCompleted)}>{body}</div>
      ) : (
        <Link className={cx(styles.card, styles.cardLink)} to={mission.to}>
          {body}
        </Link>
      )}
    </li>
  );
};

const styles = {
  item: css`
    label: MissionCard-item;
    list-style: none;
  `,

  card: css`
    label: MissionCard-card;
    display: grid;
    grid-template-columns: 1.6rem minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.6rem;
    height: 100%;
    padding: 0.65rem 0.75rem;
    border-radius: 0.9rem;
    background: var(--color-card-surface);
    color: var(--color-ink);
    text-decoration: none;
  `,

  cardLink: css`
    label: MissionCard-cardLink;

    @media (hover: hover) {
      &:hover {
        background: var(--color-card-surface-hover);
      }
    }

    &:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }
  `,

  /* 마친 미션은 파란 테두리로 구분한다. */
  cardCompleted: css`
    label: MissionCard-cardCompleted;
    background: color-mix(in srgb, var(--color-brand-blue) 14%, var(--color-canvas));
    box-shadow: inset 0 0 0 1.5px var(--color-brand-blue);
  `,

  badge: css`
    label: MissionCard-badge;
    display: grid;
    place-items: center;
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    background: var(--color-canvas);
    color: var(--color-ink-soft);
    font-size: 0.78rem;
    font-weight: 700;
  `,

  badgeCompleted: css`
    label: MissionCard-badgeCompleted;
    background: var(--color-brand-blue-ink);
    color: var(--color-on-card-accent);
  `,

  text: css`
    label: MissionCard-text;
    display: grid;
    gap: 0.15rem;
    min-width: 0;
  `,

  title: css`
    label: MissionCard-title;
    font-size: 0.86rem;
    line-height: 1.35;
    letter-spacing: -0.02em;
    word-break: keep-all;
  `,

  hint: css`
    label: MissionCard-hint;
    color: var(--color-ink-soft);
    font-size: 0.7rem;
    line-height: 1.35;
    word-break: keep-all;
  `,

  steps: css`
    label: MissionCard-steps;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.1rem;
  `,

  step: css`
    label: MissionCard-step;
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    background: var(--color-canvas);
    color: var(--color-ink-soft);
    font-size: 0.68rem;
    font-weight: 600;
  `,

  stepDone: css`
    label: MissionCard-stepDone;
    background: var(--color-brand-blue-ink);
    color: var(--color-on-card-accent);
  `,

  completed: css`
    label: MissionCard-completed;
    color: var(--color-brand-blue-ink);
    font-size: 0.7rem;
    font-weight: 700;
  `,

  action: css`
    label: MissionCard-action;
    display: grid;
    color: var(--color-brand-blue-ink);
  `,
};

export default MissionCard;
