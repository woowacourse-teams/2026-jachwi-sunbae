import { css, cx } from '@emotion/css';
import { Link } from 'react-router-dom';

import Icon from '@/shared/ui/icon/Icon';

import type { EventMissionBoardItem } from '../../hooks/useEventMissionBoard';
import { formatCompletedAt } from '../../lib/formatCompletedAt';

/** 완료 표시용 초록. 디자인 토큰에 초록이 없어 이벤트 화면에서만 쓴다. */
const DONE_GREEN = '#22a06b';

const CheckMark = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} fill="none" aria-hidden="true">
    <path d="M3.5 8.4 6.6 11.5 12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * 세로 단계의 미션 한 개. 왼쪽 번호 원이 다음 미션의 원과 선으로 이어지고, 마친 미션은 초록 체크로 바뀐다.
 * 아직 하지 않은 미션은 카드 전체가 그 기능 화면으로 가는 링크다. 단계가 둘 이상이면 단계별 진행을 함께 보여 준다.
 */
const MissionCard = ({ mission, completedAt, steps }: EventMissionBoardItem) => {
  const isCompleted = completedAt !== null;
  const body = (
    <>
      <span className={styles.text}>
        <strong className={styles.title}>
          <span className="sr-only">{`미션 ${mission.number}.`}</span> {mission.title}
        </strong>
        {mission.hint && <span className={styles.hint}>{mission.hint}</span>}
        {!isCompleted && steps.length > 1 && (
          <span className={styles.steps}>
            {steps.map(({ step, label, isDone }) => (
              <span key={step} className={cx(styles.step, isDone && styles.stepDone)}>
                {isDone && <CheckMark size={12} />}
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
    <li className={cx(styles.item, isCompleted && styles.itemCompleted)}>
      <span className={cx(styles.badge, isCompleted && styles.badgeCompleted)} aria-hidden="true">
        {isCompleted ? <CheckMark size={16} /> : mission.number}
      </span>
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

const BADGE_SIZE = '2rem';
/** 미션 목록(`EventMissionPage`)의 세로 간격. 선이 간격을 건너 이어지도록 같은 값을 쓴다. */
export const LIST_GAP = '0.6rem';

const styles = {
  /*
   * 원과 원 사이를 잇는 세로선. 항목마다 위 반쪽(::before)과 아래 반쪽(::after)을 그려 카드 높이가 달라도 이어진다.
   * 첫 미션은 위 선, 마지막 미션은 아래 선이 없고, 마친 미션에서 다음 미션까지의 선은 초록이다.
   */
  item: css`
    label: MissionCard-item;
    position: relative;
    display: grid;
    grid-template-columns: ${BADGE_SIZE} minmax(0, 1fr);
    align-items: center;
    gap: 0.75rem;
    list-style: none;

    &::before,
    &::after {
      position: absolute;
      left: calc(${BADGE_SIZE} / 2 - 1px);
      width: 2px;
      background: var(--color-border-strong);
      content: '';
    }

    &::before {
      top: calc(${LIST_GAP} / -2);
      bottom: 50%;
    }

    &::after {
      top: 50%;
      bottom: calc(${LIST_GAP} / -2);
    }

    &:first-child::before,
    &:last-child::after {
      display: none;
    }
  `,

  itemCompleted: css`
    label: MissionCard-itemCompleted;

    &::after,
    & + li::before {
      background: ${DONE_GREEN};
    }
  `,

  badge: css`
    label: MissionCard-badge;
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    width: ${BADGE_SIZE};
    height: ${BADGE_SIZE};
    border: 2px solid var(--color-border-strong);
    border-radius: 50%;
    background: var(--color-canvas);
    color: var(--color-ink-soft);
    font-size: 0.85rem;
    font-weight: 700;
  `,

  badgeCompleted: css`
    label: MissionCard-badgeCompleted;
    border-color: ${DONE_GREEN};
    background: ${DONE_GREEN};
    color: #fff;
  `,

  card: css`
    label: MissionCard-card;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.6rem;
    padding: 0.7rem 0.85rem;
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

  cardCompleted: css`
    label: MissionCard-cardCompleted;
    background: color-mix(in srgb, ${DONE_GREEN} 10%, var(--color-canvas));
  `,

  text: css`
    label: MissionCard-text;
    display: grid;
    gap: 0.15rem;
    min-width: 0;
  `,

  title: css`
    label: MissionCard-title;
    font-size: 0.9rem;
    line-height: 1.35;
    letter-spacing: -0.02em;
    word-break: keep-all;
  `,

  hint: css`
    label: MissionCard-hint;
    color: var(--color-ink-soft);
    font-size: 0.72rem;
    line-height: 1.35;
    word-break: keep-all;
  `,

  steps: css`
    label: MissionCard-steps;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.15rem;
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
    background: ${DONE_GREEN};
    color: #fff;
  `,

  completed: css`
    label: MissionCard-completed;
    color: ${DONE_GREEN};
    font-size: 0.72rem;
    font-weight: 700;
  `,

  action: css`
    label: MissionCard-action;
    display: grid;
    color: var(--color-brand-blue-ink);
  `,
};

export default MissionCard;
