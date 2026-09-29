import { getMapCategoryLabel } from '@/features/map/lib/mapPresentation';
import type { MapCategory } from '@/features/map/model/Map';

import { type MapRadius, radiusLabel } from '../../hooks/useMapNearby';

import styles from './MapNearbyCountToast.module.css';

type MapNearbyCountToastProps = {
  radius: MapRadius;
  category: MapCategory;
  count: number;
};

const categorySubject = (category: MapCategory): string => {
  const label = getMapCategoryLabel(category);
  return `${label}${['학교'].includes(label) ? '가' : '이'}`;
};

const MapNearbyCountToast = ({ radius, category, count }: MapNearbyCountToastProps) => (
  <div className={styles.toast} role="status" aria-live="polite">
    {radiusLabel(radius)} 근처에 {categorySubject(category)} {count}개 있습니다.
  </div>
);

export default MapNearbyCountToast;
