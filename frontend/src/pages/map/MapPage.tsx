import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { MapAddress } from '@/features/map/model/Map';
import type { MapMarker } from '@/features/map/ui/map-canvas/MapCanvas';
import MapCanvas from '@/features/map/ui/map-canvas/MapCanvas';

import useAddPropertyMode from './hooks/useAddPropertyMode';
import useMapFilters from './hooks/useMapFilters';
import useMapLocation from './hooks/useMapLocation';
import useMapNearby, { levelForRadius, type MapRadius } from './hooks/useMapNearby';
import useMapProperties from './hooks/useMapProperties';
import useMapSearch from './hooks/useMapSearch';
import useMapSheet from './hooks/useMapSheet';
import MapAddPropertySheet from './ui/map-add-property-sheet/MapAddPropertySheet';
import MapAddressSearch from './ui/map-address-search/MapAddressSearch';
import MapControls from './ui/map-controls/MapControls';
import MapLocationStatus from './ui/map-location-status/MapLocationStatus';
import MapNearbyCountToast from './ui/map-nearby-count-toast/MapNearbyCountToast';
import MapPropertySheet from './ui/map-property-sheet/MapPropertySheet';

import styles from './MapPage.module.css';

/** 지도 탭은 사용자가 반경을 선택했을 때만 주변 시설 반경을 표시한다. */
const INITIAL_MAP_LEVEL = 4;
const PROPERTY_MARKER_PREFIX = 'property-';

const MapPage = () => {
  const navigate = useNavigate();
  const [mapLevel, setMapLevel] = useState(INITIAL_MAP_LEVEL);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const sheet = useMapSheet();
  const search = useMapSearch();
  const filters = useMapFilters();
  const addMode = useAddPropertyMode();
  const mapLocation = useMapLocation();
  const { getFallbackCoordinate, visibleProperties, propertyMarkers } = useMapProperties(
    mapLocation.viewportCenter,
    mapLevel,
  );
  const { facilityMarkers, categoryCounts, circles } = useMapNearby(
    mapLocation.viewportCenter,
    mapLevel,
    filters.selectedCategories,
    filters.selectedRadius,
    mapLocation.currentPosition,
  );

  const { currentPosition } = mapLocation;
  const markers = useMemo<MapMarker[]>(() => {
    // 매물 추가 중에도 내가 어디에 있는지는 계속 보여 준다. 중앙 선택 핀과 역할이 다르다.
    return [
      ...propertyMarkers,
      ...facilityMarkers,
      ...(currentPosition === null
        ? []
        : [{ id: 'current-location', ...currentPosition, label: '현재 위치', tone: 'current' as const }]),
    ];
  }, [currentPosition, facilityMarkers, propertyMarkers]);

  const moveToCurrentLocation = () => void mapLocation.moveToCurrentLocation(getFallbackCoordinate);

  const selectSearchedAddress = (address: MapAddress) => {
    mapLocation.moveToAddress(address);
    setMapLevel(INITIAL_MAP_LEVEL);
    search.closeSearch();
  };

  const selectMarker = (marker: MapMarker) => {
    if (marker.tone === 'propertyCluster') {
      mapLocation.moveToCoordinate({ latitude: marker.latitude, longitude: marker.longitude });
      setMapLevel((current) => Math.max(1, current - 1));
      return;
    }
    if (marker.id.startsWith(PROPERTY_MARKER_PREFIX)) {
      setSelectedPropertyId(Number(marker.id.slice(PROPERTY_MARKER_PREFIX.length)));
      sheet.expandSheet();
    }
  };

  const selectRadius = (radius: MapRadius) => {
    if (filters.toggleRadius(radius)) setMapLevel(levelForRadius(radius));
    setSelectedPropertyId(null);
  };

  const changeCenter = (latitude: number, longitude: number) => {
    const coordinate = { latitude, longitude };
    mapLocation.panTo(coordinate);
    addMode.handleCenterChange(coordinate);
  };

  const enterAddMode = () => {
    filters.suspendRadius();
    setSelectedPropertyId(null);
    sheet.closeSheet();
    addMode.enter(mapLocation.viewportCenter);
  };

  const cancelAddMode = () => {
    addMode.cancel();
    filters.restoreRadius();
  };

  const { selectedRadius, selectedCategories } = filters;
  const toastCategory = selectedCategories.length === 1 ? selectedCategories[0] : undefined;

  return (
    <main className={styles.page}>
      <MapAddressSearch
        isOpen={search.searchOpen}
        locationLabel={mapLocation.locationLabel}
        query={search.searchQuery}
        results={search.searchResults}
        status={search.searchStatus}
        onOpen={search.openSearch}
        onClose={search.closeSearch}
        onQueryChange={search.changeQuery}
        onSubmit={() => void search.submitSearch()}
        onClear={search.clearSearch}
        onSelect={selectSearchedAddress}
      />

      <MapLocationStatus
        status={mapLocation.locationStatus}
        failure={mapLocation.locationFailure}
        canRetry={mapLocation.canRetryLocation}
        permission={mapLocation.locationPermission}
        onRetry={moveToCurrentLocation}
      />

      {!search.searchOpen && (
        <section className={styles.mapStage} aria-label="매물 지도">
          <MapCanvas
            center={mapLocation.viewportCenter}
            markers={markers}
            circles={circles}
            radiusCenter={currentPosition ?? undefined}
            level={mapLevel}
            showRadiusLabels={false}
            showCenterPin={addMode.isAddMode}
            selectedMarkerId={
              selectedPropertyId === null ? undefined : `${PROPERTY_MARKER_PREFIX}${selectedPropertyId}`
            }
            onSelectMarker={selectMarker}
            onCenterChange={changeCenter}
            onLevelChange={setMapLevel}
          />
          <MapControls
            isAddMode={addMode.isAddMode}
            selectedRadius={selectedRadius}
            selectedCategories={selectedCategories}
            categoryCounts={categoryCounts}
            sheetStage={sheet.sheetStage}
            dragHeight={sheet.dragHeight}
            isLocating={mapLocation.locationStatus === 'locating'}
            onSelectRadius={selectRadius}
            onToggleCategory={filters.toggleCategory}
            onMoveToCurrentLocation={moveToCurrentLocation}
            onEnterAddMode={enterAddMode}
          />
          {currentPosition !== null && selectedRadius !== null && toastCategory !== undefined && (
            <MapNearbyCountToast
              radius={selectedRadius}
              category={toastCategory}
              count={categoryCounts[toastCategory] ?? 0}
            />
          )}
          {addMode.isAddMode ? (
            <MapAddPropertySheet
              address={addMode.address}
              status={addMode.addressStatus}
              onCancel={cancelAddMode}
              onConfirm={(address) => navigate('/properties/new', { state: { selectedLocation: address } })}
            />
          ) : (
            <MapPropertySheet
              sheetRef={sheet.sheetRef}
              stage={sheet.sheetStage}
              dragHeight={sheet.dragHeight}
              properties={visibleProperties}
              selectedPropertyId={selectedPropertyId}
              onDragStart={sheet.handleDragStart}
              onDragMove={sheet.handleDragMove}
              onDragEnd={sheet.handleDragEnd}
              onDragCancel={sheet.handleDragCancel}
              onCycleStage={sheet.cycleSheetStage}
            />
          )}
        </section>
      )}
    </main>
  );
};

export default MapPage;
