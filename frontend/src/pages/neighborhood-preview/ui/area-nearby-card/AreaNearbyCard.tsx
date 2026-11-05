import { css } from '@emotion/css';

import { useNearbyFacilities } from '@/features/map/api/useNearbyFacilities';
import { getMapCategoryLabel } from '@/features/map/lib/mapPresentation';
import type { MapCategory } from '@/features/map/model/Map';
import MapCategoryIcon from '@/features/map/ui/map-category-icon/MapCategoryIcon';

/** 카드에 세는 생활 인프라. 지도 오른쪽 분류 레일과 같은 네 칸이다. */
const INFRA_CATEGORIES: Exclude<MapCategory, 'MEMO' | 'AGENCY'>[] = ['HOSPITAL', 'TRANSPORT', 'SCHOOL', 'CONVENIENCE'];
/** 동네 가운데에서 세는 반경. */
const NEARBY_RADIUS = 2000;
const NO_CATEGORIES: MapCategory[] = [];

type Props = {
  area: { name: string; center: { latitude: number; longitude: number } };
  /** 지도 레일에서 켜 둔 분류. 카드와 레일이 같은 상태를 쓴다. */
  selectedCategory: MapCategory | null;
  /** 분류를 누르면 다른 화면으로 가지 않고 지도 레일의 그 분류를 켠다(켜진 분류를 다시 누르면 끈다). */
  onSelectCategory: (category: MapCategory) => void;
};

/**
 * 고른 동네 가운데에서 2km 안의 병원, 교통, 학교, 편의점 수를 보여 주는 카드. 시세, 내 매물 통근 시간과 함께 시트(칸)에 둔다.
 * 분류를 누르면 지도 오른쪽 레일의 그 분류를 켜서 결과 지도에 시설을 보여 준다.
 */
const AreaNearbyCard = ({ area, selectedCategory, onSelectCategory }: Props) => {
  const nearby = useNearbyFacilities(area.center, NEARBY_RADIUS, NO_CATEGORIES, true, { loadAllCategories: true });
  return (
    <section className={styles.card} aria-label={`${area.name} 주변 분석`}>
      <span className={styles.head}>
        <strong>주변 분석</strong>
        <small>반경 2km</small>
      </span>
      <ul className={styles.counts} aria-label={`${area.name} 주변 시설 수`}>
        {INFRA_CATEGORIES.map((category) => {
          const label = getMapCategoryLabel(category);
          const count = nearby.isSuccess ? `${nearby.data.counts[category]}곳` : nearby.isError ? '-' : '…';
          const selected = selectedCategory === category;
          return (
            <li key={category}>
              <button
                type="button"
                aria-pressed={selected}
                aria-label={`${label} ${count} 지도에 ${selected ? '숨기기' : '표시하기'}`}
                onClick={() => onSelectCategory(category)}
              >
                <MapCategoryIcon category={category} />
                <span>{label}</span>
                <b>{count}</b>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

const styles = {
  card: css`
    label: AreaNearbyCard-card;
    display: grid;
    gap: 0.65rem;
    padding: 0.85rem 0.9rem;
    border: 1px solid var(--color-border);
    border-radius: 0.9rem;
    background: white;
    color: var(--color-ink);
  `,

  head: css`
    label: AreaNearbyCard-head;
    display: flex;
    align-items: center;
    justify-content: space-between;

    & strong {
      font-size: 0.9rem;
    }

    & small {
      display: inline-flex;
      align-items: center;
      color: var(--color-muted);
      font-size: 0.75rem;
    }
  `,

  counts: css`
    label: AreaNearbyCard-counts;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.4rem;
    margin: 0;
    padding: 0;
    list-style: none;

    & li {
      min-width: 0;
    }

    /* 켜진 분류는 지도 레일처럼 파란색으로 칠한다. */
    & button {
      display: grid;
      justify-items: center;
      gap: 0.2rem;
      width: 100%;
      padding: 0.35rem 0;
      border: 0;
      border-radius: 0.6rem;
      background: transparent;
      color: var(--color-ink);
      font: inherit;
      font-size: 0.72rem;
      cursor: pointer;
    }

    & button:hover {
      background: var(--color-surface-muted);
    }

    & button[aria-pressed='true'] {
      background: #648fff;
      color: #fff;
    }

    & button[aria-pressed='true'] span {
      color: #fff;
    }

    & button:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 1px;
    }

    & img {
      width: 1.5rem;
      height: 1.5rem;
    }

    & span {
      color: var(--color-ink-soft);
    }

    & b {
      font-size: 0.85rem;
    }
  `,
};

export default AreaNearbyCard;
