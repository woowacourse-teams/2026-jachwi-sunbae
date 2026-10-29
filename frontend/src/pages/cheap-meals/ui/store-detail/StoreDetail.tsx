import { css } from '@emotion/css';

import { formatStoreDistance, type GoodPriceStore } from '@/features/good-price/model/GoodPriceStore';
import Icon from '@/shared/ui/icon/Icon';

const StoreDetail = ({ store, dataAsOf }: { store: GoodPriceStore; dataAsOf: string | null }) => (
  <div className={styles.detail}>
    <p className={styles.meta}>
      {store.businessType} <span>·</span> 기준 위치에서 직선 {formatStoreDistance(store.distanceMeters)}
    </p>
    <p className={styles.address}>
      <Icon name="locate" size={18} />
      {store.address}
    </p>
    <section className={styles.menuSection} aria-label="메뉴와 서비스 가격">
      <h3>
        메뉴·서비스 <span>등록 가격 · 원</span>
      </h3>
      {store.menus.length === 0 ? (
        <p>등록된 메뉴·가격 정보가 없어요.</p>
      ) : (
        <dl>
          {store.menus.map((menu, index) => (
            <div key={`${index}-${menu.name}`}>
              <dt>{menu.name}</dt>
              <dd>{menu.price ?? '가격 정보 없음'}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
    <aside className={styles.note}>
      <strong>방문 전에 한 번 확인해 주세요</strong>
      <p>
        행정안전부 착한가격업소 현황{dataAsOf === null ? '' : ` · ${dataAsOf} 기준`}입니다. 현재 가격·영업 여부와 다를
        수 있어요.
      </p>
    </aside>
    <div className={styles.actions}>
      {store.phone !== null ? (
        <a className={styles.phone} href={`tel:${store.phone.replace(/[^+\d]/g, '')}`}>
          전화하기
        </a>
      ) : (
        <span className={styles.noPhone}>등록된 전화번호가 없어요</span>
      )}
      <a
        className={styles.mapLink}
        href={`https://map.kakao.com/link/to/${encodeURIComponent(store.name)},${store.latitude},${store.longitude}`}
        target="_blank"
        rel="noreferrer"
      >
        길찾기 <Icon name="external-link" size={16} />
      </a>
    </div>
    {store.phone !== null && <p className={styles.phoneNumber}>{store.phone}</p>}
  </div>
);

export default StoreDetail;

const styles = {
  detail: css`
    label: StoreDetail-detail;

    display: grid;
    gap: 1.25rem;
  `,
  meta: css`
    label: StoreDetail-meta;

    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin: 0;
    font-size: 0.78rem;
    color: var(--color-ink-soft);
  `,
  address: css`
    label: StoreDetail-address;

    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin: 0;
    font-size: 0.86rem;
    line-height: 1.6;

    & svg {
      flex-shrink: 0;
      margin-top: 0.15rem;
    }
  `,
  menuSection: css`
    label: StoreDetail-menuSection;

    padding: 1rem;
    border-radius: var(--radius-md);
    background: var(--color-surface-muted);

    & h3 {
      display: flex;
      justify-content: space-between;
      margin: 0 0 1rem;
      font-size: 0.9rem;
    }
    & h3 span {
      font-size: 0.7rem;
      font-weight: 400;
      color: var(--color-ink-soft);
    }
    & dl {
      display: grid;
      gap: 1rem;
      margin: 0;
    }
    & dl div {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 1rem;
      font-size: 0.86rem;
      line-height: 1.6;
    }
    & dt {
      flex: 1;
      overflow-wrap: anywhere;
    }
    & dd {
      max-width: 58%;
      margin: 0;
      font-weight: 700;
      text-align: right;
      overflow-wrap: anywhere;
    }
  `,
  note: css`
    label: StoreDetail-note;

    padding: 1rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 0.78rem;
    line-height: 1.7;

    & p {
      margin: 0.35rem 0 0;
      color: var(--color-ink-soft);
    }
  `,
  actions: css`
    label: StoreDetail-actions;

    display: flex;
    align-items: center;
    gap: 0.7rem;

    & a {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-height: 3rem;
      flex: 1;
      border-radius: var(--radius-md);
      font-size: 0.9rem;
      font-weight: 650;
      text-decoration: none;
    }
  `,
  phone: css`
    label: StoreDetail-phone;

    color: var(--color-ink);
    background: var(--color-surface-neutral);
  `,
  mapLink: css`
    label: StoreDetail-mapLink;

    background: var(--color-action);
    color: var(--color-on-action);
  `,
  noPhone: css`
    label: StoreDetail-noPhone;

    flex: 1;
    font-size: 0.7rem;
    color: var(--color-ink-soft);
  `,
  phoneNumber: css`
    label: StoreDetail-phoneNumber;

    margin: -0.6rem 0 0;
    color: var(--color-ink-soft);
    font-size: 0.75rem;
    text-align: center;
  `,
};
