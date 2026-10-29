import { css } from '@emotion/css';

import { formatStoreDistance, type GoodPriceStore } from '@/features/good-price/model/GoodPriceStore';
import Icon from '@/shared/ui/icon/Icon';

const StoreCard = ({ store, onSelect }: { store: GoodPriceStore; onSelect: (id: number) => void }) => (
  <button
    type="button"
    className={styles.card}
    onClick={() => onSelect(store.id)}
    aria-label={`${store.name} 상세 보기`}
  >
    <span className={styles.topLine}>
      <span className={styles.businessType}>{store.businessType}</span>
      <span className={styles.distance}>직선 {formatStoreDistance(store.distanceMeters)}</span>
    </span>
    <span className={styles.name}>
      {store.name}
      <Icon name="chevron-right" size={18} />
    </span>
    <span className={styles.address}>{store.address}</span>
    <span className={styles.menus}>
      {store.menus.length === 0 ? (
        <span className={styles.noMenu}>등록된 메뉴·가격 정보가 없어요</span>
      ) : (
        store.menus.slice(0, 2).map((menu, index) => (
          <span className={styles.menu} key={`${index}-${menu.name}`}>
            <span>{menu.name}</span>
            <strong>{menu.price ?? '가격 정보 없음'}</strong>
          </span>
        ))
      )}
      {store.menus.length > 2 && <span className={styles.more}>메뉴·서비스 {store.menus.length - 2}개 더 보기</span>}
    </span>
  </button>
);

export default StoreCard;

const styles = {
  card: css`
    label: StoreCard-card;

    display: grid;
    width: 100%;
    gap: 0.55rem;
    padding: 1.2rem 0;
    border: 0;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-ink);
    text-align: left;
    cursor: pointer;
  `,
  topLine: css`
    label: StoreCard-topLine;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  `,
  name: css`
    label: StoreCard-name;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;

    font-size: 1.06rem;
    font-weight: 750;
    letter-spacing: -0.035em;
    overflow-wrap: anywhere;

    & svg {
      flex-shrink: 0;
      color: var(--color-muted);
    }
  `,
  menu: css`
    label: StoreCard-menu;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;

    align-items: baseline;
    font-size: 0.84rem;
    line-height: 1.4;

    & span {
      overflow-wrap: anywhere;
      min-width: 0;
    }
    & strong {
      overflow-wrap: anywhere;
      min-width: 0;
    }
    & strong {
      text-align: right;
      max-width: 58%;
      font-size: 0.9rem;
      font-variant-numeric: tabular-nums;
    }
  `,
  businessType: css`
    label: StoreCard-businessType;

    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-ink-soft);
    background: var(--color-surface-muted);
    padding: 0.22rem 0.5rem;
    border-radius: 0.3rem;
  `,
  distance: css`
    label: StoreCard-distance;

    font-size: 0.75rem;
    color: var(--color-ink-soft);
  `,
  address: css`
    label: StoreCard-address;

    color: var(--color-ink-soft);
    font-size: 0.75rem;
    line-height: 1.5;
  `,
  menus: css`
    label: StoreCard-menus;

    display: grid;
    gap: 0.65rem;
    margin-top: 0.35rem;
    padding: 0.9rem;
    border-radius: var(--radius-sm);
    background: var(--color-surface-muted);
  `,
  more: css`
    label: StoreCard-more;

    font-size: 0.72rem;
    color: var(--color-ink-soft);
  `,
  noMenu: css`
    label: StoreCard-noMenu;

    font-size: 0.72rem;
    color: var(--color-ink-soft);
  `,
};
