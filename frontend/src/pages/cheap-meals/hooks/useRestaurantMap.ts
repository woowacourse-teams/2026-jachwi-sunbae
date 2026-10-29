import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { useGoodPriceStores } from '@/features/good-price/api/goodPriceApi';
import type { GoodPriceResult } from '@/features/good-price/model/GoodPriceStore';
import {
  coordinatesAreClose,
  DEFAULT_MAP_CENTER,
  isInSouthKorea,
  type MapCoordinate,
  requestCurrentMapLocation,
} from '@/features/map/lib/mapLocation';
import type { MapMarker } from '@/features/map/model/Map';

import storePin from '../ui/store-pin.svg';

export type RestaurantArea = MapCoordinate & { label: string };
const useRestaurantMap = (active: boolean) => {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [area, setArea] = useState<RestaurantArea>({ ...DEFAULT_MAP_CENTER, label: '판교 주변' });
  const [viewport, setViewport] = useState<MapCoordinate>(area);
  const [radius, setRadius] = useState<GoodPriceResult['radius']>(1000);
  const [level, setLevel] = useState(6);
  const [listOpen, setListOpen] = useState(true);
  const [isLocating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const requestId = useRef(0);
  useEffect(() => {
    if (!active) setLocating(false);
    return () => {
      requestId.current += 1;
    };
  }, [active]);
  const query = useGoodPriceStores(area, radius, active);
  const selectedStore = query.data?.stores.find((store) => String(store.id) === params.get('store')) ?? null;
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
  const clearSelection = () =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('store');
        next.delete('search');
        return next;
      },
      { replace: true, state: null },
    );
  const chooseArea = (next: RestaurantArea) => {
    requestId.current += 1;
    setLocating(false);
    setLocationError(null);
    setArea(next);
    setViewport(next);
    setListOpen(true);
    clearSelection();
  };
  const locate = async () => {
    const id = ++requestId.current;
    setLocating(true);
    setLocationError(null);
    try {
      const coordinate = await requestCurrentMapLocation();
      if (id !== requestId.current) return;
      if (!isInSouthKorea(coordinate)) throw new Error('국내 위치가 필요합니다.');
      chooseArea({ ...coordinate, label: '현재 위치 주변' });
    } catch {
      if (id === requestId.current) {
        setLocating(false);
        setLocationError('현재 위치를 확인하지 못했어요. 권한을 확인하거나 주소를 검색해 주세요.');
      }
    }
  };
  return {
    area,
    viewport,
    radius,
    level,
    query,
    markers,
    selectedStore,
    listOpen,
    isLocating,
    locationError,
    isMapMoved: !coordinatesAreClose(area, viewport),
    isSearchOpen: params.get('search') === '1',
    chooseArea,
    locate,
    changeLevel: setLevel,
    setListOpen,
    moveMap: (latitude: number, longitude: number) =>
      setViewport((old) => (coordinatesAreClose(old, { latitude, longitude }) ? old : { latitude, longitude })),
    searchMap: () => chooseArea({ ...viewport, label: '지도에서 선택한 위치' }),
    selectRadius: (value: GoodPriceResult['radius']) => {
      setRadius(value);
      setLevel(value === 500 ? 5 : value === 1000 ? 6 : 7);
      setViewport(area);
      setListOpen(true);
      clearSelection();
    },
    openSearch: () =>
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          next.set('search', '1');
          return next;
        },
        { state: { restaurantOverlay: true } },
      ),
    openStore: (id: number) => {
      const store = query.data?.stores.find((store) => store.id === id);
      if (!store) return;
      setViewport(store);
      setListOpen(true);
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          next.set('store', String(id));
          return next;
        },
        { state: { restaurantOverlay: true } },
      );
    },
    closeOverlay: () => {
      if ((location.state as { restaurantOverlay?: boolean } | null)?.restaurantOverlay) navigate(-1);
      else clearSelection();
    },
  };
};
export default useRestaurantMap;
