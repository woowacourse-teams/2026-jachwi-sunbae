import { useCallback, useState } from 'react';

import type { MapCoordinate, MapLocationFailure } from '@/features/map/lib/mapLocation';
import {
  coordinatesAreClose,
  DEFAULT_MAP_CENTER,
  MapLocationError,
  PANGYO_MAP_CENTER,
  readGeolocationPermission,
  readLastMapCenter,
  requestCurrentMapLocation,
  writeLastMapCenter,
} from '@/features/map/lib/mapLocation';
import type { MapAddress } from '@/features/map/model/Map';

export type MapLocationStatus = 'locating' | 'ready' | 'fallback';

/** 지도가 어디를 보고 있는지와, 그 위치를 어떻게 얻었는지를 함께 관리한다. */
const useMapLocation = () => {
  const [viewportCenter, setViewportCenter] = useState(() => readLastMapCenter() ?? DEFAULT_MAP_CENTER);
  const [currentPosition, setCurrentPosition] = useState<MapCoordinate | null>(null);
  const [locationStatus, setLocationStatus] = useState<MapLocationStatus>('ready');
  const [locationFailure, setLocationFailure] = useState<MapLocationFailure>('unavailable');
  const [locationPermission, setLocationPermission] = useState<PermissionState | 'unknown'>('unknown');
  const [locationLabel, setLocationLabel] = useState(() =>
    readLastMapCenter() === null ? '우테코 판교사옥' : '마지막으로 본 위치',
  );

  /** 위치를 얻지 못하면 실패 시점의 최신 대체 좌표를 읽는다. */
  const moveToCurrentLocation = useCallback(
    async (getFallbackCoordinate: () => (MapCoordinate & { label: string }) | undefined) => {
      // 사파리는 누른 그 순간에 요청해야 권한 창을 띄운다. 상태 변경보다 먼저 부른다.
      const request = requestCurrentMapLocation();
      setLocationStatus('locating');
      try {
        const coordinate = await request;
        setViewportCenter(coordinate);
        setCurrentPosition(coordinate);
        writeLastMapCenter(coordinate);
        setLocationLabel('현재 위치');
        setLocationStatus('ready');
      } catch (error) {
        setLocationFailure(error instanceof MapLocationError ? error.reason : 'unavailable');
        // 이미 거부된 권한은 눌러도 창이 뜨지 않는다. 버튼을 내놓을지 여기서 가른다.
        void readGeolocationPermission().then(setLocationPermission);
        // 위치 권한을 받지 못하면 마지막으로 본 위치 → 첫 매물 → 우테코 판교사옥 순으로 대체한다.
        const lastCenter = readLastMapCenter();
        const fallback = getFallbackCoordinate();

        if (lastCenter !== null) {
          setViewportCenter(lastCenter);
          setLocationLabel('마지막으로 본 위치');
        } else if (fallback !== undefined) {
          setViewportCenter({ latitude: fallback.latitude, longitude: fallback.longitude });
          setLocationLabel(fallback.label);
        } else {
          setViewportCenter(PANGYO_MAP_CENTER);
          setLocationLabel('우테코 판교사옥');
        }
        setLocationStatus('fallback');
      }
    },
    [],
  );

  const moveToAddress = useCallback((address: MapAddress) => {
    const coordinate = { latitude: address.latitude, longitude: address.longitude };
    setViewportCenter(coordinate);
    setCurrentPosition(coordinate);
    writeLastMapCenter(coordinate);
    setLocationLabel(address.roadAddress ?? address.jibunAddress ?? address.address ?? '선택한 위치');
    setLocationStatus('ready');
  }, []);

  /** 사용자가 지도를 끌어 옮긴 위치를 기억한다. */
  const panTo = useCallback((coordinate: MapCoordinate) => {
    setViewportCenter((current) => (coordinatesAreClose(current, coordinate) ? current : coordinate));
    writeLastMapCenter(coordinate);
  }, []);

  const canRetryLocation =
    locationFailure !== 'insecure' && locationFailure !== 'denied' && locationPermission !== 'denied';

  const moveToCoordinate = useCallback((coordinate: MapCoordinate) => setViewportCenter(coordinate), []);

  return {
    viewportCenter,
    moveToCoordinate,
    currentPosition,
    locationStatus,
    locationFailure,
    locationPermission,
    locationLabel,
    canRetryLocation,
    moveToCurrentLocation,
    moveToAddress,
    panTo,
  };
};

export default useMapLocation;
