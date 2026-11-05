import { css } from '@emotion/css';
import { Link, useLocation } from 'react-router-dom';

import { useNearbyFacilities } from '@/features/map/api/useNearbyFacilities';
import { type AreaNearbyBase, areaNearbyPath } from '@/features/map/lib/areaNearbyTarget';
import { getMapCategoryLabel } from '@/features/map/lib/mapPresentation';
import type { MapCategory } from '@/features/map/model/Map';
import MapCategoryIcon from '@/features/map/ui/map-category-icon/MapCategoryIcon';
import Icon from '@/shared/ui/icon/Icon';

/** 카드에 세는 생활 인프라. 중개업소는 다방 링크와 지도 마커로 따로 본다. */
const INFRA_CATEGORIES: Exclude<MapCategory, 'MEMO' | 'AGENCY'>[] = ['HOSPITAL', 'TRANSPORT', 'SCHOOL', 'CONVENIENCE'];
/** 주변 분석 지도의 처음 반경과 같게 세어, 카드를 누르고 들어가도 같은 숫자를 다시 받지 않고 보여 준다. */
const NEARBY_RADIUS = 2000;
const NO_CATEGORIES: MapCategory[] = [];

type Props = {
  area: { name: string; center: { latitude: number; longitude: number } };
  mapPath: AreaNearbyBase;
  onOpen: () => void;
};

/**
 * 고른 동네 가운데에서 2km 안의 병원, 교통, 학교, 편의점 수를 보여 주는 카드.
 * 누르면 그 동네 기준 주변 분석 지도로 가고, 뒤로 가면 지금 보던 동네 찾기 결과로 돌아온다.
 */
const AreaNearbyCard = ({ area, mapPath, onOpen }: Props) => {
  const location = useLocation();
  const nearby = useNearbyFacilities(area.center, NEARBY_RADIUS, NO_CATEGORIES, true, { loadAllCategories: true });
  const target = { name: area.name, latitude: area.center.latitude, longitude: area.center.longitude };
  return (
    <Link
      className={styles.card}
      to={areaNearbyPath(mapPath, target, `${location.pathname}${location.search}`)}
      aria-label={`${area.name} 주변 분석 지도 보기`}
      onClick={onOpen}
    >
      <span className={styles.head}>
        <strong>주변 분석</strong>
        <small>
          반경 2km
          <Icon name="chevron-right" size={16} />
        </small>
      </span>
      <ul className={styles.counts} aria-label={`${area.name} 주변 시설 수`}>
        {INFRA_CATEGORIES.map((category) => (
          <li key={category}>
            <MapCategoryIcon category={category} />
            <span>{getMapCategoryLabel(category)}</span>
            <b>{nearby.isSuccess ? `${nearby.data.counts[category]}곳` : nearby.isError ? '-' : '…'}</b>
          </li>
        ))}
      </ul>
    </Link>
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
    text-decoration: none;

    &:hover {
      background: var(--color-surface-muted);
    }

    &:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }
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
