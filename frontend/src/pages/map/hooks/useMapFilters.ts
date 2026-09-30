import { useRef, useState } from 'react';

import { selectSingleCategory } from '@/features/map/lib/mapPresentation';
import type { MapCategory } from '@/features/map/model/Map';

import type { MapRadius } from './useMapNearby';

/** 지도 탭은 시설 확인 목적에 맞춰 500m 반경을 기본으로 사용한다. */
const DEFAULT_RADIUS: MapRadius = 500;

const useMapFilters = () => {
  const [selectedCategories, setSelectedCategories] = useState<MapCategory[]>([]);
  const [selectedRadius, setSelectedRadius] = useState<MapRadius | null>(DEFAULT_RADIUS);
  const suspendedRadiusRef = useRef<MapRadius | null>(DEFAULT_RADIUS);

  const toggleCategory = (category: MapCategory) =>
    setSelectedCategories((current) => selectSingleCategory(current, category));

  /** 같은 반경을 다시 누르면 해제한다. 새로 선택되었는지 돌려준다. */
  const toggleRadius = (radius: MapRadius): boolean => {
    const isSelecting = selectedRadius !== radius;
    setSelectedRadius(isSelecting ? radius : null);
    return isSelecting;
  };

  /** 매물 추가 중에는 반경 원을 숨기고, 끝나면 이전 반경으로 되돌린다. */
  const suspendRadius = () => {
    suspendedRadiusRef.current = selectedRadius;
    setSelectedRadius(null);
  };

  const restoreRadius = () => setSelectedRadius(suspendedRadiusRef.current);

  return { selectedCategories, selectedRadius, toggleCategory, toggleRadius, suspendRadius, restoreRadius };
};

export default useMapFilters;
