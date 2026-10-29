import { css } from '@emotion/css';
import { Link } from 'react-router-dom';

import Icon from '@/shared/ui/icon/Icon';

const CheapMealCard = ({ className = '' }: { className?: string }) => (
  <Link
    to="/cheap-meals"
    className={`${styles.card} ${className}`}
    aria-label="오늘 한 끼, 저렴하게 — 저렴한 한 끼 찾기"
  >
    <span className={styles.eyebrow}>자취 중이라면?</span>
    <strong>오늘 한 끼, 저렴하게</strong>
    <span className={styles.description}>식당부터 편의점·배달 할인까지</span>
    <span className={styles.action}>
      저렴한 한 끼 찾기 <Icon name="arrow-right" size={18} />
    </span>
  </Link>
);
const styles = {
  card: css`
    label: CheapMealCard-card;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.45rem;
    margin-top: 1.2rem;
    padding: 1.35rem;
    border-radius: var(--radius-card);
    color: var(--color-ink);
    text-decoration: none;
    background: color-mix(in srgb, var(--color-brand-yellow) 22%, white);
    border: 1px solid color-mix(in srgb, var(--color-brand-yellow) 35%, white);
    & strong {
      font-size: 1.45rem;
      letter-spacing: -0.045em;
      line-height: 1.35;
    }
    &:hover {
      background: color-mix(in srgb, var(--color-brand-yellow) 30%, white);
    }
  `,
  eyebrow: css`
    label: CheapMealCard-eyebrow;
    font-size: 0.75rem;
    color: var(--color-ink-soft);
    font-weight: 600;
  `,
  description: css`
    label: CheapMealCard-description;
    font-size: 0.82rem;
    color: var(--color-ink-soft);
  `,
  action: css`
    label: CheapMealCard-action;
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.85rem;
    font-weight: 750;
    margin-top: 0.6rem;
    min-height: 30px;
  `,
};
export default CheapMealCard;
