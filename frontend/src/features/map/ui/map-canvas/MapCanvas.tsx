import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { usePublicConfig } from '@/shared/config/PublicConfigContext';
import StatusPanel from '@/shared/ui/status-panel/StatusPanel';

import { clampToSouthKorea, SOUTH_KOREA_BOUNDS } from '../../lib/mapLocation';
import type { MapMarker } from '../../model/Map';
import MapMarkerView from '../map-marker/MapMarkerView';
import { createMapMarkerElement } from '../map-marker/MapMarkerView';

import styles from './MapCanvas.module.css';

export type { MapMarker } from '../../model/Map';

export type MapRadiusCircle = {
  radiusMeters: 500 | 1000 | 2000;
  label: string;
};

type MapCanvasProps = {
  center: { latitude: number; longitude: number };
  markers?: MapMarker[];
  circles?: MapRadiusCircle[];
  level?: number;
  interactive?: boolean;
  showCenterPin?: boolean;
  showRadiusLabels?: boolean;
  selectedMarkerId?: string | null;
  onSelectMarker?: (marker: MapMarker) => void;
  onSelectLocation?: (latitude: number, longitude: number) => void;
  onCenterChange?: (latitude: number, longitude: number) => void;
  onLevelChange?: (level: number) => void;
  radiusCenter?: { latitude: number; longitude: number };
};

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

/** 앱의 확대 단계는 1이 가장 확대된 상태이고 Naver zoom은 21이 가장 확대된 상태다. */
const NAVER_ZOOM_BASE = 20;
/** 더 줄이면 남한 밖까지 한 화면에 들어온다. */
const MIN_NAVER_ZOOM = 6;
const toNaverZoom = (level: number): number => clamp(NAVER_ZOOM_BASE - level, MIN_NAVER_ZOOM, 21);
const toMapLevel = (zoom: number): number => clamp(NAVER_ZOOM_BASE - zoom, 1, 14);

let naverSdkPromise: Promise<void> | null = null;

const loadNaverSdk = (clientId: string): Promise<void> => {
  if (window.naver?.maps !== undefined) return Promise.resolve();
  if (naverSdkPromise !== null) return naverSdkPromise;
  naverSdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-jachwi-naver-map]');
    const ready = () => {
      if (window.naver?.maps === undefined) {
        naverSdkPromise = null;
        reject(new Error('Naver Maps SDK를 불러오지 못했습니다.'));
        return;
      }
      resolve();
    };
    if (existing !== null) {
      existing.addEventListener('load', ready, { once: true });
      existing.addEventListener('error', () => reject(new Error('Naver Maps SDK를 불러오지 못했습니다.')), {
        once: true,
      });
      return;
    }
    const script = document.createElement('script');
    script.dataset.jachwiNaverMap = 'true';
    script.async = true;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`;
    script.addEventListener('load', ready, { once: true });
    script.addEventListener(
      'error',
      () => {
        naverSdkPromise = null;
        reject(new Error('Naver Maps SDK를 불러오지 못했습니다.'));
      },
      { once: true },
    );
    document.head.append(script);
  });
  return naverSdkPromise;
};

type LiveEngine = {
  label: string;
  load: () => Promise<void>;
  createMap: (container: HTMLElement, center: { latitude: number; longitude: number }, level: number) => LiveMap;
  latLng: (latitude: number, longitude: number) => LiveLatLng;
  getCenter: (map: LiveMap) => { latitude: number; longitude: number };
  getZoom: (map: LiveMap) => number;
  setCenter: (map: LiveMap, center: LiveLatLng) => void;
  setZoom: (map: LiveMap, level: number) => void;
  relayout: (map: LiveMap) => void;
  addListener: (map: LiveMap, event: string, callback: (latitude?: number, longitude?: number) => void) => unknown;
  removeListener: (listener: unknown) => void;
  createOverlay: (map: LiveMap, marker: MapMarker, content: HTMLElement, zIndex: number) => LiveOverlay;
  createCircle: (map: LiveMap, center: LiveLatLng, radius: number) => LiveOverlay;
};

type LiveLatLng = NaverLatLng;
type LiveMap = NaverMap;
type LiveOverlay = NaverOverlay;

const naverEngine = (clientId: string): LiveEngine => ({
  label: 'Naver 지도',
  load: () => loadNaverSdk(clientId),
  createMap: (container, center, level) => {
    const start = clampToSouthKorea(center);
    return new window.naver!.maps.Map(container, {
      center: new window.naver!.maps.LatLng(start.latitude, start.longitude),
      zoom: toNaverZoom(level),
      // 남한 밖으로는 옮기지도 줄이지도 못하게 막는다.
      minZoom: MIN_NAVER_ZOOM,
      maxBounds: new window.naver!.maps.LatLngBounds(
        new window.naver!.maps.LatLng(SOUTH_KOREA_BOUNDS.south, SOUTH_KOREA_BOUNDS.west),
        new window.naver!.maps.LatLng(SOUTH_KOREA_BOUNDS.north, SOUTH_KOREA_BOUNDS.east),
      ),
    });
  },
  latLng: (latitude, longitude) => new window.naver!.maps.LatLng(latitude, longitude),
  getCenter: (map) => {
    const center = (map as NaverMap).getCenter();
    return { latitude: center.lat(), longitude: center.lng() };
  },
  getZoom: (map) => toMapLevel((map as NaverMap).getZoom()),
  setCenter: (map, center) => (map as NaverMap).setCenter(center as NaverLatLng),
  setZoom: (map, level) => (map as NaverMap).setZoom(toNaverZoom(level)),
  relayout: (map) => (map as NaverMap).refresh(),
  addListener: (map, event, callback) =>
    window.naver!.maps.Event.addListener(map, event, (value) => callback(value?.coord?.lat(), value?.coord?.lng())),
  removeListener: (listener) => {
    void listener;
  },
  createOverlay: (map, marker, content, zIndex) => {
    const overlay = new window.naver!.maps.OverlayView();
    const position = new window.naver!.maps.LatLng(marker.latitude, marker.longitude);
    const element = content;
    element.style.position = 'absolute';
    element.style.top = '0';
    element.style.left = '0';
    element.style.willChange = 'transform';
    element.style.zIndex = String(zIndex);
    overlay.setPosition?.(position);
    overlay.onAdd = () => overlay.getPanes?.().overlayLayer.append(element);
    overlay.draw = () => {
      const projection = overlay.getProjection?.();
      if (projection !== undefined && overlay.getPanes !== undefined) {
        const pixel = projection.fromCoordToOffset(position);
        // 확대·이동 중 left/top을 바꾸면 WebView가 마커마다 레이아웃을 다시 계산한다.
        // 합성 단계에서 처리되는 transform으로 옮겨 지도 제스처의 메인 스레드 부담을 줄인다.
        element.style.transform = `translate3d(${pixel.x}px, ${pixel.y}px, 0) translate(-50%, -50%)`;
      }
    };
    overlay.onRemove = () => element.remove();
    overlay.setMap(map as NaverMap);
    return overlay;
  },
  createCircle: (map, center, radius) =>
    new window.naver!.maps.Circle({
      map: map as NaverMap,
      center: center as NaverLatLng,
      radius,
      strokeWeight: 2,
      strokeColor: '#555555',
      strokeOpacity: 0.58,
      fillColor: '#999999',
      fillOpacity: 0.08,
    }),
});

/** 이 값이 같으면 마커를 다시 그릴 필요가 없다. */
const markerSignature = (marker: MapMarker, selectedMarkerId: string | null): string =>
  [
    marker.latitude,
    marker.longitude,
    marker.tone ?? '',
    marker.category ?? '',
    marker.count ?? '',
    marker.photoUrl ?? '',
    marker.label,
    marker.caption ?? '',
    marker.actionable === true ? '1' : '0',
    selectedMarkerId === marker.id ? '1' : '0',
  ].join('|');

const markerZIndex = (marker: MapMarker, selectedMarkerId: string | null): number => {
  if (selectedMarkerId === marker.id) return 10;
  if (marker.tone === 'selected') return 9;
  if (marker.tone === 'property' || marker.tone === 'propertyCluster') return 8;
  if (marker.tone === 'current') return 7;
  return 5;
};

const demoMarkerStyle = (marker: MapMarker, center: { latitude: number; longitude: number }): CSSProperties => ({
  left: `${clamp(50 + (marker.longitude - center.longitude) * 3_100, 9, 91)}%`,
  top: `${clamp(50 - (marker.latitude - center.latitude) * 4_200, 10, 88)}%`,
});

const MapCanvas = ({
  center,
  markers = [],
  circles = [],
  level = 5,
  interactive = false,
  showCenterPin = false,
  showRadiusLabels = false,
  selectedMarkerId = null,
  onSelectMarker,
  onSelectLocation,
  onCenterChange,
  onLevelChange,
  radiusCenter = center,
}: MapCanvasProps) => {
  const config = usePublicConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LiveMap | null>(null);
  const overlaysRef = useRef(new Map<string, { signature: string; overlay: LiveOverlay }>());
  const circlesRef = useRef<LiveOverlay[]>([]);
  const callbackRef = useRef({ onSelectLocation, onCenterChange, onLevelChange, onSelectMarker });
  const [mapReady, setMapReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);
  // 남한 밖 좌표를 받아도 지도는 남한 안만 비춘다.
  const boundedCenter = useMemo(() => clampToSouthKorea(center), [center.latitude, center.longitude]);
  const engine = useMemo(() => naverEngine(config.naverMapClientId ?? ''), [config.naverMapClientId]);
  const liveMode = config.mapProviderMode === 'naver' && (config.naverMapClientId ?? '') !== '';

  callbackRef.current = { onSelectLocation, onCenterChange, onLevelChange, onSelectMarker };

  useEffect(() => {
    if (!liveMode || containerRef.current === null) return;
    let disposed = false;
    let map: LiveMap | null = null;

    setSdkError(false);
    setMapReady(false);
    void engine
      .load()
      .then(() => {
        if (disposed || containerRef.current === null) return;
        map = engine.createMap(containerRef.current, boundedCenter, level);
        mapRef.current = map;
        engine.addListener(map, 'click', (latitude, longitude) => {
          if (latitude !== undefined && longitude !== undefined)
            callbackRef.current.onSelectLocation?.(latitude, longitude);
        });
        engine.addListener(map, 'idle', () => {
          if (map === null) return;
          const nextCenter = engine.getCenter(map);
          callbackRef.current.onCenterChange?.(nextCenter.latitude, nextCenter.longitude);
          callbackRef.current.onLevelChange?.(engine.getZoom(map));
        });
        setMapReady(true);
      })
      .catch(() => {
        if (!disposed) setSdkError(true);
      });

    return () => {
      disposed = true;
      overlaysRef.current.forEach(({ overlay }) => overlay.setMap(null));
      overlaysRef.current.clear();
      circlesRef.current.forEach((circle) => circle.setMap(null));
      circlesRef.current = [];
      mapRef.current = null;
    };
  }, [engine, liveMode]);

  useEffect(() => {
    if (!liveMode || !mapReady || mapRef.current === null) return;
    const current = engine.getCenter(mapRef.current);
    if (
      Math.abs(current.latitude - boundedCenter.latitude) < 0.0000001 &&
      Math.abs(current.longitude - boundedCenter.longitude) < 0.0000001
    )
      return;
    engine.setCenter(mapRef.current, engine.latLng(boundedCenter.latitude, boundedCenter.longitude));
  }, [boundedCenter, engine, liveMode, mapReady]);

  useEffect(() => {
    if (
      !liveMode ||
      !mapReady ||
      typeof ResizeObserver === 'undefined' ||
      containerRef.current === null ||
      mapRef.current === null
    )
      return;
    const map = mapRef.current;
    const observer = new ResizeObserver(() => {
      engine.relayout(map);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [engine, liveMode, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!liveMode || !mapReady || map === null || engine.getZoom(map) === level) return;
    engine.setZoom(map, level);
  }, [engine, level, liveMode, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!liveMode || !mapReady || map === null) return;
    // 달라진 마커만 다시 그린다. 전부 지웠다 만들면 지도를 옮길 때마다 깜빡인다.
    const previous = overlaysRef.current;
    const next = new Map<string, { signature: string; overlay: LiveOverlay }>();

    markers.forEach((marker) => {
      const signature = markerSignature(marker, selectedMarkerId);
      const kept = previous.get(marker.id);
      if (kept !== undefined && kept.signature === signature) {
        previous.delete(marker.id);
        next.set(marker.id, kept);
        return;
      }
      if (kept !== undefined) {
        kept.overlay.setMap(null);
        previous.delete(marker.id);
      }
      const content = createMapMarkerElement(marker, selectedMarkerId, (selected) =>
        callbackRef.current.onSelectMarker?.(selected),
      );
      next.set(marker.id, {
        signature,
        overlay: engine.createOverlay(map, marker, content, markerZIndex(marker, selectedMarkerId)),
      });
    });

    previous.forEach(({ overlay }) => overlay.setMap(null));
    overlaysRef.current = next;
  }, [engine, liveMode, mapReady, markers, selectedMarkerId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!liveMode || !mapReady || map === null) return;
    circlesRef.current.forEach((circle) => circle.setMap(null));
    circlesRef.current = circles.map((circle) =>
      engine.createCircle(map, engine.latLng(radiusCenter.latitude, radiusCenter.longitude), circle.radiusMeters),
    );
    return () => {
      circlesRef.current.forEach((circle) => circle.setMap(null));
      circlesRef.current = [];
    };
  }, [circles, engine, liveMode, mapReady, radiusCenter.latitude, radiusCenter.longitude]);

  return (
    <div
      className={`${styles.canvas} ${liveMode ? styles.live : styles.demo}`}
      aria-label={liveMode ? engine.label : '데모 지도'}
      onClick={(event) => {
        if (liveMode || !interactive || onSelectLocation === undefined) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const picked = clampToSouthKorea({
          latitude: boundedCenter.latitude + (0.5 - (event.clientY - rect.top) / rect.height) * 0.018,
          longitude: boundedCenter.longitude + ((event.clientX - rect.left) / rect.width - 0.5) * 0.024,
        });
        onSelectLocation(picked.latitude, picked.longitude);
      }}
    >
      {liveMode && (
        <div className={styles.liveLayer}>
          <div ref={containerRef} className={styles.liveMap} />
        </div>
      )}
      {!liveMode && (
        <>
          <span className={styles.roadOne} />
          <span className={styles.roadTwo} />
          <span className={styles.park}>MOCA PARK</span>
          {circles.map((circle) => (
            <span
              key={circle.radiusMeters}
              className={styles.radiusCircle}
              style={{
                width: `${(circle.radiusMeters / 2000) * 84}%`,
                left: `${50 + (radiusCenter.longitude - boundedCenter.longitude) * 3_100}%`,
                top: `${50 - (radiusCenter.latitude - boundedCenter.latitude) * 4_200}%`,
              }}
              aria-hidden="true"
            />
          ))}
          {markers.map((marker) => {
            return (
              <div key={marker.id} className={styles.demoMarkerPosition} style={demoMarkerStyle(marker, boundedCenter)}>
                <MapMarkerView marker={marker} selectedMarkerId={selectedMarkerId} onSelectMarker={onSelectMarker} />
              </div>
            );
          })}
          <span className={styles.demoBadge}>DEMO MAP</span>
        </>
      )}
      {showCenterPin && (
        <span className={styles.fixedCenterPin} aria-label="선택할 지도 중심" role="img">
          <span aria-hidden="true">+</span>
        </span>
      )}
      {showRadiusLabels && (
        <div className={styles.radiusLabels} aria-hidden="true">
          {circles
            .slice()
            .reverse()
            .map((circle) => (
              <span key={circle.radiusMeters}>{circle.label}</span>
            ))}
        </div>
      )}
      {sdkError && (
        <div className={styles.mapError}>
          <StatusPanel title="지도를 연결할 수 없어요." description="잠시 후 다시 시도해 주세요." tone="error" />
        </div>
      )}
    </div>
  );
};

export default MapCanvas;
