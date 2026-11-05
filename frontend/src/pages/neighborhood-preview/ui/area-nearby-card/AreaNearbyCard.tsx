import { css } from '@emotion/css';

import { useNearbyFacilities } from '@/features/map/api/useNearbyFacilities';
import { getMapCategoryLabel } from '@/features/map/lib/mapPresentation';
import type { MapCategory } from '@/features/map/model/Map';
import MapCategoryIcon from '@/features/map/ui/map-category-icon/MapCategoryIcon';

/** 카드에 세는 생활 인프라. 지도 레일(병원, 교통, 학교, 편의)에 중개사를 더한다. */
const INFRA_CATEGORIES: Exclude<MapCategory, 'MEMO'>[] = ['HOSPITAL', 'TRANSPORT', 'SCHOOL', 'CONVENIENCE', 'AGENCY'];
/** 동네 가운데에서 세는 반경. */
const NEARBY_RADIUS = 2000;
/** 카카오 장소 검색이 한 번에 주는 최대 개수. 이 값에 닿으면 실제로는 더 있을 수 있어 `45+`로 적는다. */
export const KAKAO_PLACE_LIMIT = 45;
const NO_CATEGORIES: MapCategory[] = [];

/** 카드 숫자. 교통(버스정류장)은 따로 받아 상한이 없고, 나머지는 카카오 상한에 닿으면 `45+`로 적는다. */
export const nearbyCountLabel = (category: MapCategory, count: number) =>
  category !== 'TRANSPORT' && count >= KAKAO_PLACE_LIMIT ? `${KAKAO_PLACE_LIMIT}+곳` : `${count}곳`;

type Props = {
  area: { name: string; center: { latitude: number; longitude: number } };
};

/**
 * 동네 가운데에서 2km 안의 병원, 교통, 학교, 편의점, 중개사 수를 보여 주는 카드.
 * 결과가 나오면 처음부터 1위 동네 기준으로 띄우고, 동네를 고르면 그 동네로 바꾼다.
 * 숫자만 보여 주고 지도 마커는 켜지 않는다. 마커는 지도 오른쪽 레일로만 켠다.
 */
const AreaNearbyCard = ({ area }: Props) => {
  const nearby = useNearbyFacilities(area.center, NEARBY_RADIUS, NO_CATEGORIES, true, { loadAllCategories: true });
  return (
    <section className={styles.card} aria-label={`${area.name} 주변 분석`}>
      <span className={styles.head}>
        <strong>{area.name} 주변</strong>
        <small>반경 2km</small>
      </span>
      <ul className={styles.counts} aria-label={`${area.name} 주변 시설 수`}>
        {INFRA_CATEGORIES.map((category) => (
          <li key={category}>
            <MapCategoryIcon category={category} />
            <span>{category === 'AGENCY' ? '중개사' : getMapCategoryLabel(category)}</span>
            <b>
              {nearby.isSuccess ? nearbyCountLabel(category, nearby.data.counts[category]) : nearby.isError ? '-' : '…'}
            </b>
          </li>
        ))}
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
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.4rem;
    margin: 0;
    padding: 0;
    list-style: none;

    & li {
      display: grid;
      justify-items: center;
      gap: 0.2rem;
      min-width: 0;
      font-size: 0.72rem;
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
