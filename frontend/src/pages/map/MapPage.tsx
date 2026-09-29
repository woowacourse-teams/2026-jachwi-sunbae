import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useNavigate } from 'react-router-dom';
import { fetchNearby, reverseGeocode, searchAddress } from '../../features/map/api/mapApi';
import MapCanvas from '../../features/map/ui/map-canvas/MapCanvas';
import type { MapMarker, MapRadiusCircle } from '../../features/map/ui/map-canvas/MapCanvas';

import MapCategoryRail from '../../features/map/ui/map-category-rail/MapCategoryRail';
import PageAction from '../../shared/ui/page-action/PageAction';
import { clusterNearbyPlaces, clusterProperties } from '../../features/map/lib/mapClustering';
import MapAddPropertySheet from './ui/map-add-property-sheet/MapAddPropertySheet';
import MapAddressSearch from './ui/map-address-search/MapAddressSearch';
import MapLocationStatus from './ui/map-location-status/MapLocationStatus';
import MapPropertySheet from './ui/map-property-sheet/MapPropertySheet';
import type { MapPropertySheetStage } from './ui/map-property-sheet/MapPropertySheet';
import MapRadiusSelector from '../../features/map/ui/map-radius-selector/MapRadiusSelector';
import { usePropertyPhotoObjectUrls } from '../../features/property/api/usePropertyPhotoObjectUrls';
import { ALL_MAP_CATEGORIES, getMapCategoryLabel, selectSingleCategory } from '../../features/map/lib/mapPresentation';
import Icon from '../../shared/ui/icon/Icon';
import { usePropertyList } from '../../features/property/api/useProperties';

import type { MapAddress, MapCategory } from '../../features/map/model/Map';
import { formatRentSummary } from '../../features/property/lib/propertyFormat';
import type { PublicConfig } from '../../shared/config/publicConfigTypes';
import {
  coordinatesAreClose,
  DEFAULT_MAP_CENTER,
  MapLocationError,
  PANGYO_MAP_CENTER,
  readLastMapCenter,
  readGeolocationPermission,
  requestCurrentMapLocation,
  writeLastMapCenter,
} from '../../features/map/lib/mapLocation';
import type { MapLocationFailure } from '../../features/map/lib/mapLocation';
import styles from './MapPage.module.css';

/** 지도 탭은 시설 확인 목적에 맞춰 500m 반경을 기본으로 사용한다. */
const INITIAL_MAP_LEVEL = 4;
const RADIUS_OPTIONS = [500, 1000, 2000] as const;
type MapRadius = (typeof RADIUS_OPTIONS)[number];

/** 이 픽셀 이상 끌어야 단계가 바뀐다. 탭과 구분하는 기준. */
const SHEET_DRAG_THRESHOLD = 20;

const radiusLabel = (radius: MapRadius): string => (radius === 500 ? '500m' : `${radius / 1000}km`);
const levelForRadius = (radius: MapRadius): number => (radius === 500 ? 4 : radius === 1000 ? 5 : 6);
const categorySubject = (category: MapCategory): string =>
  `${getMapCategoryLabel(category)}${['학교'].includes(getMapCategoryLabel(category)) ? '가' : '이'}`;

const getViewportSpan = (level: number) => {
  const baseLat = 0.0035 * Math.pow(1.7, Math.max(0, level - 2));
  const baseLng = 0.0045 * Math.pow(1.7, Math.max(0, level - 2));
  return { latSpan: baseLat, lngSpan: baseLng };
};

const MapPage = ({ config }: { config: PublicConfig }) => {
  const navigate = useNavigate();
  const properties = usePropertyList(config);

  const items = useMemo(() => properties.data?.pages.flatMap((page) => page.content) ?? [], [properties.data]);
  const mapped = useMemo(
    () => items.filter((item) => item.location.latitude !== null && item.location.longitude !== null),
    [items],
  );
  const propertyPhotoUrls = usePropertyPhotoObjectUrls(config, mapped);
  const mappedRef = useRef(mapped);
  mappedRef.current = mapped;
  const [viewportCenter, setViewportCenter] = useState(() => readLastMapCenter() ?? DEFAULT_MAP_CENTER);
  const [currentPosition, setCurrentPosition] = useState(viewportCenter);
  const [locationStatus, setLocationStatus] = useState<'locating' | 'ready' | 'fallback'>('locating');
  const [locationFailure, setLocationFailure] = useState<MapLocationFailure>('unavailable');
  const [locationPermission, setLocationPermission] = useState<PermissionState | 'unknown'>('unknown');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mapLevel, setMapLevel] = useState(INITIAL_MAP_LEVEL);
  const [locationLabel, setLocationLabel] = useState('현재 위치');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [addAddress, setAddAddress] = useState<MapAddress | null>(null);
  const [addAddressStatus, setAddAddressStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [selectedCategories, setSelectedCategories] = useState<MapCategory[]>([]);
  const [selectedRadius, setSelectedRadius] = useState<MapRadius | null>(500);
  const [sheetStage, setSheetStage] = useState<MapPropertySheetStage>('closed');
  const radiusBeforeAddModeRef = useRef<MapRadius | null>(500);
  const touchStartYRef = useRef<number | null>(null);
  const sheetRef = useRef<HTMLElement | null>(null);
  const dragStartRef = useRef<{ y: number; height: number } | null>(null);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const draggedSheetRef = useRef(false);
  const addAddressRequestRef = useRef(0);
  const addAddressTimerRef = useRef<number | null>(null);

  // 현재 지도 뷰포트 내에 실제로 보이는 매물 목록 필터링
  const visibleProperties = useMemo(() => {
    const { latSpan, lngSpan } = getViewportSpan(mapLevel);
    return mapped.filter((item) => {
      if (item.location.latitude === null || item.location.longitude === null) return false;
      const latDiff = Math.abs(item.location.latitude - viewportCenter.latitude);
      const lngDiff = Math.abs(item.location.longitude - viewportCenter.longitude);
      return latDiff <= latSpan && lngDiff <= lngSpan;
    });
  }, [mapped, mapLevel, viewportCenter.latitude, viewportCenter.longitude]);

  const nearbyRadius = selectedRadius ?? 500;

  const nearby = useQuery({
    queryKey: [
      'nearby-map',
      viewportCenter.latitude,
      viewportCenter.longitude,
      nearbyRadius,
      ALL_MAP_CATEGORIES.join(','),
    ],
    queryFn: ({ signal }) =>
      fetchNearby(config, viewportCenter.latitude, viewportCenter.longitude, nearbyRadius, ALL_MAP_CATEGORIES, signal),
  });

  const moveToCurrentLocation = useCallback(async () => {
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
      const firstProperty = mappedRef.current[0];
      const propertyCenter =
        firstProperty !== undefined &&
        firstProperty.location.latitude !== null &&
        firstProperty.location.longitude !== null
          ? { latitude: firstProperty.location.latitude, longitude: firstProperty.location.longitude }
          : null;

      if (lastCenter !== null) {
        setViewportCenter(lastCenter);
        setCurrentPosition(lastCenter);
        setLocationLabel('마지막으로 본 위치');
      } else if (propertyCenter !== null && firstProperty !== undefined) {
        setViewportCenter(propertyCenter);
        setCurrentPosition(propertyCenter);
        setLocationLabel(firstProperty.name);
      } else {
        setViewportCenter(PANGYO_MAP_CENTER);
        setCurrentPosition(PANGYO_MAP_CENTER);
        setLocationLabel('우테코 판교사옥');
      }
      setLocationStatus('fallback');
    }
  }, []);

  const resolveAddAddress = useCallback(
    async (coordinate: { latitude: number; longitude: number }) => {
      const requestId = addAddressRequestRef.current + 1;
      addAddressRequestRef.current = requestId;
      setAddAddressStatus('loading');
      try {
        const address = await reverseGeocode(config, coordinate.latitude, coordinate.longitude);
        if (addAddressRequestRef.current !== requestId) return;
        setAddAddress(address);
        setAddAddressStatus('idle');
      } catch {
        if (addAddressRequestRef.current !== requestId) return;
        setAddAddress(null);
        setAddAddressStatus('error');
      }
    },
    [config],
  );

  const enterAddMode = () => {
    radiusBeforeAddModeRef.current = selectedRadius;
    setSelectedRadius(null);
    setIsAddMode(true);
    setSelectedPropertyId(null);
    setSheetStage('closed');
    void resolveAddAddress(viewportCenter);
  };

  const cancelAddMode = () => {
    setIsAddMode(false);
    setSelectedRadius(radiusBeforeAddModeRef.current);
  };

  useEffect(() => {
    void moveToCurrentLocation();
  }, [moveToCurrentLocation]);

  const canRetryLocation =
    locationFailure !== 'insecure' && locationFailure !== 'denied' && locationPermission !== 'denied';

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
      selectedRadius === null
        ? []
        : RADIUS_OPTIONS.filter((value) => value <= selectedRadius).map((value) => ({
            radiusMeters: value,
            label: radiusLabel(value),
          })),
    [selectedRadius],
  );

  const propertyMarkers = useMemo(
    () =>
      clusterProperties(
        mapped.map((item) => ({
          propertyId: item.propertyId,
          name: item.name,
          latitude: item.location.latitude ?? PANGYO_MAP_CENTER.latitude,
          longitude: item.location.longitude ?? PANGYO_MAP_CENTER.longitude,
          caption: formatRentSummary(item.depositAmount, item.monthlyRentAmount),
          photoUrl: propertyPhotoUrls[item.propertyId],
        })),
        mapLevel,
      ),
    [mapLevel, mapped, propertyPhotoUrls],
  );

  const markers = useMemo<MapMarker[]>(() => {
    // 매물 추가 중에도 내가 어디에 있는지는 계속 보여 준다. 중앙 선택 핀과 역할이 다르다.
    return [
      ...propertyMarkers,
      ...facilityMarkers,
      {
        id: 'current-location',
        ...currentPosition,
        label: '현재 위치',
        tone: 'current' as const,
      },
    ];
  }, [currentPosition, facilityMarkers, propertyMarkers]);

  const applySearchedAddress = (address: MapAddress) => {
    const coordinate = { latitude: address.latitude, longitude: address.longitude };
    setViewportCenter(coordinate);
    setCurrentPosition(coordinate);
    setMapLevel(INITIAL_MAP_LEVEL);
    writeLastMapCenter(coordinate);
    setLocationLabel(address.roadAddress ?? address.jibunAddress ?? address.address ?? '선택한 위치');
    setLocationStatus('ready');
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MapAddress[]>([]);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const executeSearch = async (text: string) => {
    if (text.trim() === '') return;
    setSearchStatus('loading');
    try {
      const results = await searchAddress(config, text.trim());
      setSearchResults(results);
      setSearchStatus('idle');
    } catch {
      setSearchStatus('error');
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchStatus('idle');
  };

  /** 세 단계의 실제 높이(px). 시트가 놓인 컨테이너 크기에 따라 달라진다. */
  const sheetStageHeights = (): Record<MapPropertySheetStage, number> => {
    const stageHeight = sheetRef.current?.parentElement?.getBoundingClientRect().height ?? 0;
    const rem = 16;
    return {
      closed: 1.9 * rem,
      mid: Math.min(stageHeight * 0.42, 22 * rem),
      full: Math.max(stageHeight - 4.25 * rem, 0),
    };
  };

  // 포인터를 캡처해야 헤더 밖에서 손을 떼도 드래그가 끝까지 이어진다.
  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    const height = sheetRef.current?.getBoundingClientRect().height ?? 0;
    dragStartRef.current = { y: event.clientY, height };
    touchStartYRef.current = event.clientY;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  // 끄는 동안 손끝만큼 높이를 바꿔 시트가 따라오게 한다.
  const handleDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (start === null) return;
    const heights = sheetStageHeights();
    const next = start.height + (start.y - event.clientY);
    setDragHeight(Math.min(Math.max(next, heights.closed), heights.full));
  };

  const handleDragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    const startY = touchStartYRef.current;
    dragStartRef.current = null;
    touchStartYRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setDragHeight(null);
    if (start === null || startY === null) return;
    if (Math.abs(event.clientY - startY) <= SHEET_DRAG_THRESHOLD) return;
    draggedSheetRef.current = true;
    // 손을 뗀 높이에서 가장 가까운 단계로 붙인다.
    const heights = sheetStageHeights();
    const released = start.height + (start.y - event.clientY);
    const nearest = (Object.entries(heights) as Array<[MapPropertySheetStage, number]>).reduce((best, entry) =>
      Math.abs(entry[1] - released) < Math.abs(best[1] - released) ? entry : best,
    );
    setSheetStage(nearest[0]);
  };

  const cycleSheetStage = () => {
    if (draggedSheetRef.current) {
      draggedSheetRef.current = false;
      return;
    }
    setSheetStage((current) => (current === 'closed' ? 'mid' : current === 'mid' ? 'full' : 'closed'));
  };

  const handleSelectSearchedAddress = (address: MapAddress) => {
    applySearchedAddress(address);
    closeSearch();
  };

  return (
    <main className={styles.page}>
      <MapAddressSearch
        isOpen={searchOpen}
        locationLabel={locationLabel}
        query={searchQuery}
        results={searchResults}
        status={searchStatus}
        onOpen={() => setSearchOpen(true)}
        onClose={closeSearch}
        onQueryChange={(value) => {
          setSearchQuery(value);
          if (value.trim() === '') {
            setSearchResults([]);
            setSearchStatus('idle');
          }
        }}
        onSubmit={() => void executeSearch(searchQuery)}
        onClear={() => {
          setSearchQuery('');
          setSearchResults([]);
          setSearchStatus('idle');
        }}
        onSelect={handleSelectSearchedAddress}
      />

      <MapLocationStatus
        status={locationStatus}
        failure={locationFailure}
        canRetry={canRetryLocation}
        permission={locationPermission}
        onRetry={() => void moveToCurrentLocation()}
      />

      {!searchOpen && (
        <section className={styles.mapStage} aria-label="매물 지도">
          <MapCanvas
            config={config}
            center={viewportCenter}
            markers={markers}
            circles={circles}
            radiusCenter={currentPosition}
            level={mapLevel}
            showRadiusLabels={false}
            showCenterPin={isAddMode}
            selectedMarkerId={selectedPropertyId !== null ? `property-${selectedPropertyId}` : undefined}
            onSelectMarker={(marker) => {
              if (marker.tone === 'propertyCluster') {
                // 묶인 핀은 한 단계 확대해 안에 들어 있는 매물을 풀어 준다.
                setViewportCenter({ latitude: marker.latitude, longitude: marker.longitude });
                setMapLevel((current) => Math.max(1, current - 1));
                return;
              }
              if (marker.id.startsWith('property-')) {
                const id = Number(marker.id.slice('property-'.length));
                setSelectedPropertyId(id);
                setSheetStage('full');
                return;
              }
            }}
            onCenterChange={(latitude, longitude) => {
              const coordinate = { latitude, longitude };
              setViewportCenter((current) => (coordinatesAreClose(current, coordinate) ? current : coordinate));
              writeLastMapCenter(coordinate);
              if (isAddMode) {
                if (addAddressTimerRef.current !== null) window.clearTimeout(addAddressTimerRef.current);
                addAddressTimerRef.current = window.setTimeout(() => void resolveAddAddress(coordinate), 450);
              }
            }}
            onLevelChange={setMapLevel}
          />

          {!isAddMode && (
            <MapRadiusSelector
              label="시설 확인 반경"
              options={RADIUS_OPTIONS.map((value) => ({
                value,
                label: radiusLabel(value),
                isSelected: selectedRadius === value,
              }))}
              onSelect={(value) => {
                const selected = selectedRadius === value;
                setSelectedRadius((current) => (current === value ? null : value));
                if (!selected) setMapLevel(levelForRadius(value));
                setSelectedPropertyId(null);
              }}
            />
          )}

          {/* 우측 상단 카테고리 레일 */}
          {!isAddMode && (
            <MapCategoryRail
              className={styles.mapCategoryRail}
              selectedCategories={selectedCategories}
              counts={categoryCounts}
              onToggle={(category) => setSelectedCategories((current) => selectSingleCategory(current, category))}
            />
          )}

          {/* 우측 지도 컨트롤: 위는 현재 위치, 아래는 매물 추가 */}

          <div className={styles.mapControls}>
            <button
              type="button"
              className={styles.currentLocationButton}
              aria-label="내 현재 위치로 이동"
              disabled={locationStatus === 'locating'}
              onClick={() => void moveToCurrentLocation()}
            >
              <Icon name="target" size={22} />
            </button>
          </div>

          {!isAddMode && (
            <div
              className={styles.addPropertyAction}
              data-sheet={sheetStage}
              data-dragging={dragHeight === null ? undefined : 'true'}
              style={dragHeight === null ? undefined : ({ '--sheet-height': `${dragHeight}px` } as React.CSSProperties)}
            >
              <PageAction placement="inline" onClick={enterAddMode} aria-label="지도에서 매물 추가">
                매물 추가
              </PageAction>
            </div>
          )}

          {isAddMode && (
            <MapAddPropertySheet
              address={addAddress}
              status={addAddressStatus}
              onCancel={cancelAddMode}
              onConfirm={(address) => navigate('/properties/new', { state: { selectedLocation: address } })}
            />
          )}

          {selectedRadius !== null && selectedCategories.length === 1 && (
            <div className={styles.nearbyCountToast} role="status" aria-live="polite">
              {radiusLabel(selectedRadius)} 근처에 {categorySubject(selectedCategories[0])}{' '}
              {categoryCounts[selectedCategories[0]] ?? 0}개 있습니다.
            </div>
          )}

          {!isAddMode && mapped.length > 0 && (
            <MapPropertySheet
              sheetRef={sheetRef}
              stage={sheetStage}
              dragHeight={dragHeight}
              properties={visibleProperties}
              selectedPropertyId={selectedPropertyId}
              config={config}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onDragCancel={(event) => {
                touchStartYRef.current = null;
                dragStartRef.current = null;
                setDragHeight(null);
                event.currentTarget.releasePointerCapture?.(event.pointerId);
              }}
              onCycleStage={cycleSheetStage}
            />
          )}
        </section>
      )}
    </main>
  );
};

export default MapPage;
