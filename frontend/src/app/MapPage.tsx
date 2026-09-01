import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useNavigate } from 'react-router-dom';
import { fetchNearby, reverseGeocode, searchAddress } from '../apis/mapApi';
import MapCanvas from '../components/MapCanvas';
import type { MapMarker, MapRadiusCircle } from '../components/MapCanvas';

import MapCategoryRail from '../components/MapCategoryRail';
import { clusterNearbyPlaces, clusterProperties } from '../components/mapClustering';
import { usePropertyPhotoObjectUrls } from '../hooks/query/usePropertyPhotoObjectUrls';
import { ALL_MAP_CATEGORIES, getMapCategoryLabel, selectSingleCategory } from '../components/mapPresentation';
import PropertyCard from '../components/PropertyCard';
import { Button } from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import SearchField from '../components/ui/SearchField';
import { usePropertyList } from '../hooks/query/useProperties';

import type { MapAddress, MapCategory } from '../types/Map';
import { formatRentSummary } from '../utils/propertyFormat';
import type { PublicConfig } from '../types/PublicConfig';
import {
  coordinatesAreClose,
  DEFAULT_MAP_CENTER,
  PANGYO_MAP_CENTER,
  readLastMapCenter,
  requestCurrentMapLocation,
  writeLastMapCenter,
} from '../utils/mapLocation';
import styles from './MapPage.module.css';

/** 지도 탭은 시설 확인 목적에 맞춰 500m 반경을 기본으로 사용한다. */
const INITIAL_MAP_LEVEL = 4;
const RADIUS_OPTIONS = [500, 1000, 2000] as const;
type MapRadius = (typeof RADIUS_OPTIONS)[number];
type SheetStage = 'closed' | 'mid' | 'full';

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [mapLevel, setMapLevel] = useState(INITIAL_MAP_LEVEL);
  const [locationLabel, setLocationLabel] = useState('현재 위치');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [addAddress, setAddAddress] = useState<MapAddress | null>(null);
  const [addAddressStatus, setAddAddressStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [selectedCategories, setSelectedCategories] = useState<MapCategory[]>([]);
  const [selectedRadius, setSelectedRadius] = useState<MapRadius | null>(500);
  const [sheetStage, setSheetStage] = useState<SheetStage>('closed');
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
    setLocationStatus('locating');
    try {
      const coordinate = await requestCurrentMapLocation();
      setViewportCenter(coordinate);
      setCurrentPosition(coordinate);
      writeLastMapCenter(coordinate);
      setLocationLabel('현재 위치');
      setLocationStatus('ready');
    } catch {
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

  const resolveAddAddress = useCallback(async (coordinate: { latitude: number; longitude: number }) => {
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
  }, [config]);

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
  const sheetStageHeights = (): Record<SheetStage, number> => {
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
    const nearest = (Object.entries(heights) as Array<[SheetStage, number]>).reduce((best, entry) =>
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
    <main className={`${styles.page} ${styles.explorePage}`}>
      {/* 상단 검색바 & 매물 추가 버튼 */}
      <div className={styles.topSearchBar}>
        {searchOpen ? (
          <SearchField
            className={styles.activeSearchField}
            label="주소 검색"
            placeholder="도로명 또는 지번 주소 검색"
            value={searchQuery}
            shape="pill"
            autoFocus
            showSubmitButton={false}
            onBack={closeSearch}
            onValueChange={(val) => {
              setSearchQuery(val);
              if (val.trim() === '') {
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
          />
        ) : (
          <div className={styles.searchBarRow}>
            <button
              type="button"
              className={styles.searchTrigger}
              aria-label="주소 또는 위치 검색"
              onClick={() => setSearchOpen(true)}
            >
              <Icon name="search" size={18} />
              <span className={styles.searchPrompt}>{locationLabel}</span>
            </button>
          </div>
        )}
      </div>

      {locationStatus !== 'ready' && (
        <div
          className={styles.locationStatus}
          role={locationStatus === 'fallback' ? 'alert' : 'status'}
          aria-live="polite"
        >
          <span>
            {locationStatus === 'locating' ? '현재 위치를 확인하는 중이에요.' : '현재 위치에 연결되지 않았어요.'}
          </span>
          {locationStatus === 'fallback' && (
            <button type="button" onClick={() => void moveToCurrentLocation()}>
              다시 연결
            </button>
          )}
        </div>
      )}

      {searchOpen ? (
        /* 검색 전용 전체 페이지 뷰 */
        <section className={styles.searchPageView} aria-label="주소 검색 화면">
          {searchStatus === 'loading' && (
            <p className={styles.searchStateText} role="status">
              주소를 찾는 중이에요…
            </p>
          )}
          {searchStatus === 'error' && (
            <p className={styles.searchErrorText} role="alert">
              주소를 찾지 못했어요. 다시 시도해 주세요.
            </p>
          )}
          {searchStatus === 'idle' && searchQuery.trim() !== '' && searchResults.length === 0 && (
            <p className={styles.searchStateText}>검색 결과가 없어요.</p>
          )}
          {searchResults.length > 0 && (
            <ul className={styles.searchResultsList} aria-label="주소 검색 결과">
              {searchResults.map((result) => {
                const primary = result.roadAddress ?? result.jibunAddress ?? result.address ?? '주소 정보 없음';
                const secondary =
                  result.roadAddress !== null && result.jibunAddress !== null ? result.jibunAddress : null;

                return (
                  <li key={`${result.latitude}-${result.longitude}`}>
                    <button
                      type="button"
                      className={styles.searchResultItem}
                      onClick={() => handleSelectSearchedAddress(result)}
                    >
                      <Icon name="locate" size={18} />
                      <div className={styles.searchResultText}>
                        <strong>{primary}</strong>
                        {secondary !== null && <small>{secondary}</small>}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : (
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
            <div className={styles.radiusFilters} aria-label="시설 확인 반경">
              {RADIUS_OPTIONS.map((value) => {
                const selected = selectedRadius === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setSelectedRadius((current) => (current === value ? null : value));
                      if (!selected) setMapLevel(levelForRadius(value));
                      setSelectedPropertyId(null);
                    }}
                  >
                    {radiusLabel(value)}
                  </button>
                );
              })}
            </div>
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

          {/* 우측 위치 컨트롤 */}
          {!isAddMode && (
            <div className={styles.mapControls}>
              <button
                type="button"
                className={styles.addAtCenterButton}
                aria-label="지도에서 매물 추가"
                onClick={enterAddMode}
              >
                <Icon name="plus" size={22} />
              </button>
            </div>
          )}

          <div
            className={styles.currentLocationControl}
            data-sheet={isAddMode ? 'closed' : sheetStage}
            data-dragging={dragHeight === null ? undefined : 'true'}
            style={
              dragHeight === null || isAddMode
                ? undefined
                : ({ '--sheet-height': `${dragHeight}px` } as CSSProperties)
            }
          >
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

          {/* 하단 2단계 스냅 바텀시트 (X 버튼 제거, 핸들 및 헤더 클릭/드래그 지원) */}
          {isAddMode && (
            <section className={styles.addModeSheet} aria-label="선택한 위치로 매물 추가">
              <strong>
                {addAddressStatus === 'loading'
                  ? '주소를 확인하는 중이에요.'
                  : (addAddress?.roadAddress ?? addAddress?.jibunAddress ?? '주소를 확인하지 못했어요.')}
              </strong>
              {addAddressStatus === 'error' && <p>지도를 움직여 다른 위치를 선택해 주세요.</p>}
              <div className={styles.addModeActions}>
                <Button type="button" variant="secondary" fullWidth onClick={cancelAddMode}>
                  취소
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  fullWidth
                  disabled={addAddress === null || addAddressStatus === 'loading'}
                  onClick={() => {
                    if (addAddress === null) return;
                    navigate('/properties/new', { state: { selectedLocation: addAddress } });
                  }}
                >
                  이 주소로 매물 추가
                </Button>
              </div>
            </section>
          )}

          {selectedRadius !== null && selectedCategories.length === 1 && (
            <div
              className={`${styles.nearbyCountToast} ${
                sheetStage === 'mid'
                  ? styles.nearbyCountToastMid
                  : sheetStage === 'full'
                    ? styles.nearbyCountToastFull
                    : ''
              }`}
              role="status"
              aria-live="polite"
            >
              {radiusLabel(selectedRadius)} 근처에 {categorySubject(selectedCategories[0])} {categoryCounts[selectedCategories[0]] ?? 0}개
              있습니다.
            </div>
          )}

          {!isAddMode && mapped.length > 0 && (
          <section
            ref={sheetRef}
            className={`${styles.propertyModal} ${
              sheetStage === 'closed'
                ? styles.modalCollapsed
                : sheetStage === 'mid'
                  ? styles.modalMid
                  : styles.modalFull
            }`}
            style={dragHeight === null ? undefined : { height: `${dragHeight}px` }}
            data-dragging={dragHeight === null ? undefined : 'true'}
            aria-label="지도 주변 매물 목록"
          >
            <div
              className={styles.modalHeader}
              onPointerDown={handleDragStart}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
              onPointerCancel={(event) => {
                touchStartYRef.current = null;
                dragStartRef.current = null;
                setDragHeight(null);
                event.currentTarget.releasePointerCapture?.(event.pointerId);
              }}
              onClick={cycleSheetStage}
            >
              <div className={styles.modalGrabber}>
                <span className={styles.modalHandle} />
              </div>
              <div className={styles.modalHeadingRow}>
                <span>지도 위 매물</span>
              </div>
            </div>

            <div className={styles.modalBody}>
              {(() => {
                const targetProperty =
                  visibleProperties.find((item) => item.propertyId === selectedPropertyId) ??
                  visibleProperties[0] ??
                  null;

                if (targetProperty !== null) {
                  return (
                    <div className={styles.singleCardContainer}>
                      <PropertyCard property={targetProperty} config={config} />
                    </div>
                  );
                }

                return <div className={styles.emptyNoticeArea}>현재 지도 화면에 등록된 매물이 없어요.</div>;
              })()}
            </div>
          </section>
          )}
        </section>
      )}
    </main>
  );
};

export default MapPage;
