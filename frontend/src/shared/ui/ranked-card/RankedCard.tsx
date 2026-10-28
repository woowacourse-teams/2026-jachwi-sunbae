import { css } from '@emotion/css';

import rank1 from '@/shared/assets/illustrations/rank-1.webp';
import rank2 from '@/shared/assets/illustrations/rank-2.webp';
import rank3 from '@/shared/assets/illustrations/rank-3.webp';
import rank4 from '@/shared/assets/illustrations/rank-4.webp';
import rank5 from '@/shared/assets/illustrations/rank-5.webp';

import RailCard from '../rail-card/RailCard';

export type CardRank = 1 | 2 | 3 | 4 | 5;

/** 순위 숫자 대신 보여 주는 3D 리본 메달 이미지. */
const RANK_IMAGES: Record<CardRank, string> = { 1: rank1, 2: rank2, 3: rank3, 4: rank4, 5: rank5 };
export type RankedCardProps = {
  rank: CardRank;
  title: string;
  value: string | number;
  unit?: string;
  description?: string;
  selected?: boolean;
  disabled?: boolean;
  onSelect: () => void;
  className?: string;
};

const RankedCard = ({
  rank,
  title,
  value,
  unit = '',
  description,
  selected = false,
  disabled = false,
  onSelect,
  className,
}: RankedCardProps) => (
  <RailCard
    className={`${styles.card} ${className ?? ''}`.trim()}
    aria-label={`${rank}위 ${title} ${value}${unit}${description ? ` ${description}` : ''}`}
    selected={selected}
    disabled={disabled}
    onSelect={onSelect}
  >
    <span className={styles.heading}>
      <img className={styles.rank} src={RANK_IMAGES[rank]} alt="" width={96} height={96} aria-hidden="true" />
      <span className={styles.title}>{title}</span>
    </span>
    <strong className={styles.value}>
      {value}
      {unit && <span>{unit}</span>}
    </strong>
    {description && <span className={styles.description}>{description}</span>}
  </RailCard>
);

const styles = {
  card: css`
    label: RankedCard-card;
    display: grid;
    gap: 0.55rem;
    min-width: 0;
    padding: 0.8rem;
    border: 1px solid var(--color-border);
    border-radius: 0.7rem;
    background: var(--color-surface);

    &:hover:not(:disabled) {
      background: var(--color-surface-muted);
    }
  `,

  heading: css`
    label: RankedCard-heading;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
  `,

  /* 순위는 숫자 원 대신 리본 메달 이미지로 보여 준다. 순위 자체는 카드 이름(aria-label)으로 읽힌다. */
  rank: css`
    label: RankedCard-rank;
    display: block;
    width: 2.5rem;
    height: 2.5rem;
    flex: none;
    object-fit: contain;
    user-select: none;
  `,

  title: css`
    label: RankedCard-title;
    font-size: 0.8rem;
    font-weight: 650;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  `,

  value: css`
    label: RankedCard-value;
    font-size: 1.5rem;

    & span {
      font-size: 0.8rem;
      margin-left: 0.2rem;
    }
  `,

  description: css`
    label: RankedCard-description;
    font-size: 0.7rem;
    color: var(--color-muted);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  `,
};

export default RankedCard;
