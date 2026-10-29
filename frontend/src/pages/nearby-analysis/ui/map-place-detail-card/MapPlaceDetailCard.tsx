import { css } from '@emotion/css';

import { getMapCategoryLabel } from '@/features/map/lib/mapPresentation';
import type { NearbyPlace } from '@/features/map/model/Map';
import MapCategoryIcon from '@/features/map/ui/map-category-icon/MapCategoryIcon';
import Icon from '@/shared/ui/icon/Icon';

type MapPlaceDetailCardProps = {
  place: NearbyPlace;
  avoidControls?: boolean;
  onClose: () => void;
};

const MapPlaceDetailCard = ({ place, avoidControls = false, onClose }: MapPlaceDetailCardProps) => (
  <section
    className={styles.card}
    data-category={place.category}
    data-avoid-controls={avoidControls || undefined}
    aria-label={`${place.name} 시설 상세`}
    aria-live="polite"
  >
    <span className={styles.iconWrap}>
      <MapCategoryIcon category={place.category} className={styles.icon} />
    </span>
    <div className={styles.content}>
      <span>{getMapCategoryLabel(place.category)}</span>
      <strong>{place.name}</strong>
      <p>
        <b>{place.distanceMeters}m</b>
        <span aria-hidden="true">·</span>
        {place.address || '주소 정보 없음'}
      </p>
    </div>
    <button type="button" aria-label={`${place.name} 상세 닫기`} onClick={onClose}>
      <Icon name="close" size={16} />
    </button>
  </section>
);

const styles = {
  card: css`
    label: MapPlaceDetailCard-card;
    --place-color: #64748b;
    position: absolute;
    z-index: 17;
    right: 0.75rem;
    bottom: 8.2rem;
    left: 0.75rem;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.6rem;
    align-items: center;
    min-height: 4.75rem;
    padding: 0.62rem;
    border: 1px solid color-mix(in srgb, var(--place-color) 28%, white);
    border-radius: 1rem;
    background: rgb(255 255 255 / 97%);
    box-shadow: 0 0.45rem 1.2rem rgb(42 48 35 / 20%);
    backdrop-filter: blur(10px);

    &[data-avoid-controls='true'] {
      right: 4.35rem;
    }

    &[data-category='HOSPITAL'] {
      --place-color: #f06b57;
    }

    &[data-category='TRANSPORT'] {
      --place-color: #7963e8;
    }

    &[data-category='SCHOOL'] {
      --place-color: #f59e0b;
    }

    &[data-category='CONVENIENCE'] {
      --place-color: #08a982;
    }

    & > button {
      display: grid;
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: #f5f5f3;
      color: #555b52;
      cursor: pointer;
      place-items: center;
    }

    @media (max-width: 340px) {
      left: 0.5rem;
    }

    @media (max-width: 340px) {
      &[data-avoid-controls='true'] {
        right: 3.85rem;
      }
    }
  `,

  iconWrap: css`
    label: MapPlaceDetailCard-iconWrap;
    display: grid;
    place-items: center;
  `,

  /* 아이콘이 둥근 사각 바탕을 갖고 있어 감싸는 칸에는 색을 따로 칠하지 않는다. */
  icon: css`
    label: MapPlaceDetailCard-icon;
    font-size: 2.4rem;
  `,

  content: css`
    label: MapPlaceDetailCard-content;
    display: grid;
    min-width: 0;
    gap: 0.08rem;

    & > span {
      color: var(--place-color);
      font-size: 0.54rem;
      font-weight: 900;
    }

    & > strong {
      overflow: hidden;
      font-size: 0.78rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    & > p {
      display: flex;
      min-width: 0;
      gap: 0.25rem;
      margin: 0;
      overflow: hidden;
      color: var(--color-muted);
      font-size: 0.58rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    & > p b {
      flex: 0 0 auto;
      color: var(--color-ink-soft);
    }
  `,
};

export default MapPlaceDetailCard;
