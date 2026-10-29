import { useEffect, useMemo, useRef, useState } from 'react';

import { useGoodPriceStores } from '@/features/good-price/api/goodPriceApi';
import {
  coordinatesAreClose,
  DEFAULT_MAP_CENTER,
  isInSouthKorea,
  type MapCoordinate,
  requestCurrentMapLocation,
} from '@/features/map/lib/mapLocation';
import type { MapMarker } from '@/features/map/model/Map';

import { RESTAURANT_SEARCH_RADIUS, type RestaurantArea } from '../model/RestaurantMap';
import storePin from '../ui/store-pin.svg';
import useRestaurantOverlay from './useRestaurantOverlay';

const useRestaurantMap = (isActive: boolean) => {
  const overlay = useRestaurantOverlay();
  const [area, setArea] = useState<RestaurantArea>({ ...DEFAULT_MAP_CENTER, label: '판교 주변' });
  const [viewport, setViewport] = useState<MapCoordinate>(area);
  const [level, setLevel] = useState(7);
  const [isListOpen, setIsListOpen] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const requestId = useRef(0);
  useEffect(() => {
    setIsLocating(false);
    return () => {
      requestId.current += 1;
    };
  }, [isActive, overlay.isSearchOpen]);
  const query = useGoodPriceStores(area, RESTAURANT_SEARCH_RADIUS, isActive);
  const selectedStore = query.data?.stores.find((store) => String(store.id) === overlay.selectedStoreId) ?? null;
  const markers = useMemo<MapMarker[]>(
    () =>
      query.data?.stores.map((store) => ({
        id: String(store.id),
        latitude: store.latitude,
        longitude: store.longitude,
        label: `${store.name} 상세 보기`,
        image: { src: storePin },
        actionable: true,
      })) ?? [],
    [query.data],
  );
  const chooseArea = (next: RestaurantArea) => {
    requestId.current += 1;
    setIsLocating(false);
    setLocationError(null);
    setArea(next);
    setViewport(next);
    setIsListOpen(true);
    overlay.closeOverlay();
  };
  const locate = async () => {
    const id = ++requestId.current;
    setIsLocating(true);
    setLocationError(null);
    try {
      const coordinate = await requestCurrentMapLocation();
      if (id !== requestId.current) return;
      if (!isInSouthKorea(coordinate)) throw new Error('국내 위치가 필요합니다.');
      chooseArea({ ...coordinate, label: '현재 위치 주변' });
    } catch {
      if (id === requestId.current) {
        setIsLocating(false);
        setLocationError('현재 위치를 확인하지 못했어요. 권한을 확인하거나 주소를 검색해 주세요.');
      }
    }
  };
  return {
    area,
    viewport,
    radius: RESTAURANT_SEARCH_RADIUS,
    level,
    query,
    markers,
    selectedStore,
    isListOpen,
    isLocating,
    locationError,
    isMapMoved: !coordinatesAreClose(area, viewport),
    isSearchOpen: overlay.isSearchOpen,
    chooseArea,
    locate,
    changeLevel: setLevel,
    openList: () => setIsListOpen(true),
    closeList: () => setIsListOpen(false),
    moveMap: (latitude: number, longitude: number) =>
      setViewport((old) => (coordinatesAreClose(old, { latitude, longitude }) ? old : { latitude, longitude })),
    searchMap: () => chooseArea({ ...viewport, label: '지도에서 선택한 위치' }),
    openSearch: overlay.openSearch,
    openStore: (id: number) => {
      const store = query.data?.stores.find((store) => store.id === id);
      if (!store) return;
      setViewport(store);
      setIsListOpen(true);
      overlay.openStore(id);
    },
    closeOverlay: () => {
      requestId.current += 1;
      setIsLocating(false);
      overlay.closeOverlay();
    },
  };
};
export default useRestaurantMap;
