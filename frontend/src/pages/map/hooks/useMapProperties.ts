import { useCallback, useMemo, useRef } from 'react';

import { clusterProperties } from '@/features/map/lib/mapClustering';
import type { MapCoordinate } from '@/features/map/lib/mapLocation';
import { PANGYO_MAP_CENTER } from '@/features/map/lib/mapLocation';
import type { MapMarker } from '@/features/map/ui/map-canvas/MapCanvas';
import { usePropertyList } from '@/features/property/api/useProperties';
import { usePropertyPhotoObjectUrls } from '@/features/property/api/usePropertyPhotoObjectUrls';
import { formatRentSummary } from '@/features/property/lib/propertyFormat';
import type { PropertySummary } from '@/features/property/model/Property';

const getViewportSpan = (level: number) => {
  const baseLat = 0.0035 * Math.pow(1.7, Math.max(0, level - 2));
  const baseLng = 0.0045 * Math.pow(1.7, Math.max(0, level - 2));
  return { latSpan: baseLat, lngSpan: baseLng };
};

const useMapProperties = (viewportCenter: MapCoordinate, mapLevel: number) => {
  const properties = usePropertyList();
  const items = useMemo(() => properties.data?.pages.flatMap((page) => page.content) ?? [], [properties.data]);
  const mapped = useMemo(
    () => items.filter((item) => item.location.latitude !== null && item.location.longitude !== null),
    [items],
  );
  const mappedRef = useRef<PropertySummary[]>(mapped);
  mappedRef.current = mapped;
  const getFallbackCoordinate = useCallback(() => {
    const property = mappedRef.current[0];
    if (property?.location.latitude == null || property.location.longitude == null) return undefined;
    return { latitude: property.location.latitude, longitude: property.location.longitude, label: property.name };
  }, []);
  const visibleProperties = useMemo(() => {
    const { latSpan, lngSpan } = getViewportSpan(mapLevel);
    return mapped.filter((item) => {
      if (item.location.latitude === null || item.location.longitude === null) return false;
      const latDiff = Math.abs(item.location.latitude - viewportCenter.latitude);
      const lngDiff = Math.abs(item.location.longitude - viewportCenter.longitude);
      return latDiff <= latSpan && lngDiff <= lngSpan;
    });
  }, [mapped, mapLevel, viewportCenter.latitude, viewportCenter.longitude]);

  // 지도 밖 매물의 사진까지 미리 받으면 WebView 메모리와 이미지 디코딩 비용이 커진다.
  // 현재 화면에 표시될 매물만 사진 마커에 사용한다.
  const propertyPhotoUrls = usePropertyPhotoObjectUrls(visibleProperties);

  const propertyMarkers = useMemo<MapMarker[]>(
    () =>
      clusterProperties(
        visibleProperties.map((item) => ({
          propertyId: item.propertyId,
          name: item.name,
          latitude: item.location.latitude ?? PANGYO_MAP_CENTER.latitude,
          longitude: item.location.longitude ?? PANGYO_MAP_CENTER.longitude,
          caption: formatRentSummary(item.depositAmount, item.monthlyRentAmount),
          photoUrl: propertyPhotoUrls[item.propertyId],
        })),
        mapLevel,
      ),
    [mapLevel, propertyPhotoUrls, visibleProperties],
  );

  return { getFallbackCoordinate, visibleProperties, propertyMarkers };
};

export default useMapProperties;
