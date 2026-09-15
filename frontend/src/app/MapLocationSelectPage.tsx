import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { reverseGeocode } from '../apis/mapApi';
import type { PropertyInputDto } from '../apis/dtos/PropertyDto';
import MapAddressSearchPanel from '../components/MapAddressSearchPanel';
import MapCanvas from '../components/MapCanvas';
import type { MapMarker } from '../components/MapCanvas';
import Icon from '../components/ui/Icon';
import TopNavigation from '../components/ui/TopNavigation';
import { usePropertyList } from '../hooks/query/useProperties';
import { useCreateProperty } from '../hooks/query/usePropertyMutations';
import type { MapAddress } from '../types/Map';
import type { PublicConfig } from '../types/PublicConfig';
import { trackMetaPixelFirstPropertyRecorded } from '../utils/metaPixel';
import { trackPostHogEvent } from '../utils/posthog';
import {
  coordinatesAreClose,
  DEFAULT_MAP_CENTER,
  readLastMapCenter,
  requestCurrentMapLocation,
  writeLastMapCenter,
} from '../utils/mapLocation';
import styles from './MapPage.module.css';

type MapLocationRouteState = {
  returnTo?: string;
  initialLocation?: MapAddress;
  registrationDraft?: PropertyInputDto;
};

const blankAddress = (latitude: number, longitude: number): MapAddress => ({
  address: null,
  roadAddress: null,
  jibunAddress: null,
  latitude,
  longitude,
});

const MapLocationSelectPage = ({ config }: { config: PublicConfig }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state as MapLocationRouteState | null) ?? {};
  const returnTo = routeState.returnTo ?? '/properties/new';
  const launchedFromForm = routeState.returnTo !== undefined;
  const editing = returnTo.endsWith('/edit');
  const registrationDraft = routeState.registrationDraft;
  const fallbackCenter = readLastMapCenter() ?? DEFAULT_MAP_CENTER;

  const [selected, setSelected] = useState<MapAddress>(
    () => routeState.initialLocation ?? blankAddress(fallbackCenter.latitude, fallbackCenter.longitude),
  );
  const [status, setStatus] = useState<'locating' | 'geocoding' | 'ready' | 'error'>(
    routeState.initialLocation === undefined ? 'locating' : 'ready',
  );
  // 이미 아는 위치를 확인하러 왔으면 건물이 보이는 단계로, 처음 고르는 중이면 조금 넓게 연다.
  const knownLocationLevel = routeState.initialLocation === undefined ? 5 : 3;
  const [searchOpen, setSearchOpen] = useState(false);
  const properties = usePropertyList(config);
  const createProperty = useCreateProperty(config);
  const requestSequenceRef = useRef(0);
  const centerTimerRef = useRef<number | null>(null);

  const selectCoordinates = useCallback(
    async (latitude: number, longitude: number) => {
      const sequence = requestSequenceRef.current + 1;
      requestSequenceRef.current = sequence;
      setSelected(blankAddress(latitude, longitude));
      setStatus('geocoding');
      try {
        const address = await reverseGeocode(config, latitude, longitude);
        if (requestSequenceRef.current !== sequence) return;
        setSelected(address);
        writeLastMapCenter(address);
        setStatus('ready');
      } catch {
        if (requestSequenceRef.current !== sequence) return;
        setStatus('error');
      }
    },
    [config],
  );

  const moveToCurrentLocation = useCallback(async () => {
    setStatus('locating');
    try {
      const coordinate = await requestCurrentMapLocation();
      await selectCoordinates(coordinate.latitude, coordinate.longitude);
    } catch {
      setStatus('error');
      setSearchOpen(true);
    }
  }, [selectCoordinates]);

  useEffect(() => {
    if (routeState.initialLocation === undefined) {
      void moveToCurrentLocation();
      return;
    }

    if (
      routeState.initialLocation.address === null &&
      routeState.initialLocation.roadAddress === null &&
      routeState.initialLocation.jibunAddress === null
    ) {
      void selectCoordinates(routeState.initialLocation.latitude, routeState.initialLocation.longitude);
    }
  }, [moveToCurrentLocation, routeState.initialLocation, selectCoordinates]);

  useEffect(
    () => () => {
      if (centerTimerRef.current !== null) window.clearTimeout(centerTimerRef.current);
    },
    [],
  );

  const propertyMarkers = useMemo<MapMarker[]>(
    () =>
      (properties.data?.pages.flatMap((page) => page.content) ?? [])
        .filter((property) => property.location.latitude !== null && property.location.longitude !== null)
        .map((property) => ({
          id: `property-${property.propertyId}`,
          latitude: property.location.latitude ?? DEFAULT_MAP_CENTER.latitude,
          longitude: property.location.longitude ?? DEFAULT_MAP_CENTER.longitude,
          label: property.name,
          tone: 'property',
        })),

    [properties.data?.pages],
  );

  const applyAddress = (address: MapAddress) => {
    requestSequenceRef.current += 1;
    setSelected(address);
    writeLastMapCenter(address);
    setStatus('ready');
  };

  const selectedAddress = selected.roadAddress ?? selected.jibunAddress;

  return (
    <main className={`${styles.page} ${styles.selectPage}`}>
      <TopNavigation
        className={styles.mapNavigation}
        title="지도에서 위치 확인"
        {...(registrationDraft === undefined
          ? { backTo: launchedFromForm ? returnTo : '/map' }
          : {
              onBack: () => navigate(returnTo, { replace: true, state: { registrationDraft } }),
            })}
        backLabel="이전 화면으로 돌아가기"
        meta="13-2"
      />
      <section className={styles.mapStage} aria-label="매물 위치 선택 지도">
        <MapCanvas
          config={config}
          center={selected}
          markers={propertyMarkers}
          level={knownLocationLevel}
          interactive
          showCenterPin
          onSelectLocation={(latitude, longitude) => void selectCoordinates(latitude, longitude)}
          onCenterChange={(latitude, longitude) => {
            const coordinate = { latitude, longitude };
            if (coordinatesAreClose(selected, coordinate)) return;
            if (centerTimerRef.current !== null) window.clearTimeout(centerTimerRef.current);
            centerTimerRef.current = window.setTimeout(() => void selectCoordinates(latitude, longitude), 450);
          }}
        />

        <MapAddressSearchPanel
          config={config}
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSelect={applyAddress}
        />

        <div className={styles.selectMapControls}>
          <button type="button" aria-label="주소 검색 열기" onClick={() => setSearchOpen(true)}>
            <Icon name="search" size={20} />
          </button>
          <button
            type="button"
            aria-label="내 현재 위치로 이동"
            disabled={status === 'locating'}
            onClick={() => void moveToCurrentLocation()}
          >
            <Icon name="target" size={22} />
          </button>
        </div>

        <section className={styles.addressSheet} aria-live="polite">
          <strong>
            {selectedAddress ?? (status === 'error' ? '주소를 확인하지 못했어요' : '주소를 확인하는 중이에요')}
          </strong>
          <p>
            {selected.roadAddress !== null && selected.jibunAddress !== null
              ? selected.jibunAddress
              : '지도를 움직이거나 위치를 눌러 주세요.'}
          </p>
          {status === 'error' ? (
            <button className={styles.addressNotice} type="button" onClick={() => setSearchOpen(true)}>
              주소로 다시 찾아볼까요?
            </button>
          ) : (
            <p className={styles.addressHint}>표시된 주소가 맞는지 확인해 주세요.</p>
          )}
          <button
            className={styles.confirmLocationButton}
            type="button"
            disabled={status !== 'ready' || selectedAddress === null || createProperty.isPending}
            onClick={() => {
              if (registrationDraft !== undefined) {
                void createProperty
                  .mutateAsync({
                    ...registrationDraft,
                    roadAddress: selected.roadAddress,
                    jibunAddress: selected.jibunAddress,
                    latitude: selected.latitude,
                    longitude: selected.longitude,
                  })
                  .then((created) => {
                    if (created.firstProperty) trackMetaPixelFirstPropertyRecorded();
                    trackPostHogEvent('property_created', { first_property: created.firstProperty });
                    navigate(`/properties/${created.propertyId}`, { replace: true });
                  })
                  .catch(() => undefined);
                return;
              }
              navigate(returnTo, {
                replace: true,
                state: {
                  roadAddress: selected.roadAddress ?? '',
                  jibunAddress: selected.jibunAddress ?? '',
                  latitude: selected.latitude,
                  longitude: selected.longitude,
                },
              });
            }}
          >
            {createProperty.isPending
              ? '매물을 등록하는 중…'
              : editing
                ? '이 위치 적용하기'
                : '이 위치로 매물 등록하기'}
          </button>
          {createProperty.isError && (
            <p className={styles.addressError} role="alert">
              매물을 등록하지 못했어요. 입력한 정보는 유지되니 다시 시도해 주세요.
            </p>
          )}
        </section>
      </section>
    </main>
  );
};

export default MapLocationSelectPage;
