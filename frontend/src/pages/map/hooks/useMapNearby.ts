import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { fetchNearby } from '@/features/map/api/mapApi';
import { clusterNearbyPlaces } from '@/features/map/lib/mapClustering';
import type { MapCoordinate } from '@/features/map/lib/mapLocation';
import { ALL_MAP_CATEGORIES } from '@/features/map/lib/mapPresentation';
import type { MapCategory } from '@/features/map/model/Map';
import type { MapRadiusCircle } from '@/features/map/ui/map-canvas/MapCanvas';
import { usePublicConfig } from '@/shared/config/PublicConfigContext';

export const RADIUS_OPTIONS = [500, 1000, 2000] as const;
export type MapRadius = (typeof RADIUS_OPTIONS)[number];

export const radiusLabel = (radius: MapRadius): string => (radius === 500 ? '500m' : `${radius / 1000}km`);
export const levelForRadius = (radius: MapRadius): number => (radius === 500 ? 4 : radius === 1000 ? 5 : 6);

const useMapNearby = (
  viewportCenter: MapCoordinate,
  mapLevel: number,
  selectedCategories: MapCategory[],
  selectedRadius: MapRadius | null,
  currentPosition: MapCoordinate | null,
) => {
  const config = usePublicConfig();
  const nearbyRadius = selectedRadius ?? 500;
  // 반경 모드의 조회와 원은 같은 GPS 좌표를 기준으로 한다. 화면 이동은 기준점을 바꾸지 않는다.
  const queryCenter = selectedRadius === null ? viewportCenter : currentPosition;
  const nearby = useQuery({
    queryKey: ['nearby-map', queryCenter?.latitude, queryCenter?.longitude, nearbyRadius, ALL_MAP_CATEGORIES.join(',')],
    queryFn: ({ signal }) => {
      if (queryCenter === null) throw new Error('주변 시설 조회 기준 좌표가 없습니다.');
      return fetchNearby(config, queryCenter.latitude, queryCenter.longitude, nearbyRadius, ALL_MAP_CATEGORIES, signal);
    },
    enabled: queryCenter !== null,
  });

  const filteredPlaces = useMemo(
    () => nearby.data?.places.filter((place) => selectedCategories.includes(place.category)) ?? [],
    [nearby.data?.places, selectedCategories],
  );

  const facilityMarkers = useMemo(() => clusterNearbyPlaces(filteredPlaces, mapLevel), [filteredPlaces, mapLevel]);

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<MapCategory, number>> = {};
    nearby.data?.places.forEach((place) => {
      counts[place.category] = (counts[place.category] ?? 0) + 1;
    });
    return counts;
  }, [nearby.data?.places]);

  const circles = useMemo<MapRadiusCircle[]>(
    () =>
      selectedRadius === null || currentPosition === null
        ? []
        : RADIUS_OPTIONS.filter((value) => value <= selectedRadius).map((value) => ({
            radiusMeters: value,
            label: radiusLabel(value),
          })),
    [selectedRadius, currentPosition],
  );

  return { nearby, filteredPlaces, facilityMarkers, categoryCounts, circles };
};

export default useMapNearby;
