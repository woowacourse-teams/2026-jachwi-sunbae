import { useRef, useState } from 'react';

import { selectSingleCategory } from '@/features/map/lib/mapPresentation';
import type { MapCategory } from '@/features/map/model/Map';

import type { MapRadius } from './useMapNearby';

const useMapFilters = () => {
  const [selectedCategories, setSelectedCategories] = useState<MapCategory[]>([]);
  // 반경은 사용자가 직접 선택했을 때만 표시한다. 초기 화면에 현재 위치 기준 원을 자동으로 띄우지 않는다.
  const [selectedRadius, setSelectedRadius] = useState<MapRadius | null>(null);
  const suspendedRadiusRef = useRef<MapRadius | null>(null);

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
