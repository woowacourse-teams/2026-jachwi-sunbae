import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { MapCategory } from '../types/Map';
import type { PublicConfig } from '../types/PublicConfig';
import MapCategoryIcon, { createMapCategoryIconElement } from './MapCategoryIcon';
import StatusPanel from './StatusPanel';
import styles from './MapCanvas.module.css';

export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  /** 마커 아래에 노출할 짧은 문구. 없으면 label을 쓴다. */
  caption?: string;
  tone?: 'property' | 'current' | 'place' | 'selected' | 'cluster' | 'propertyCluster';
  category?: MapCategory;
  count?: number;
  placeId?: string;
  /** 마커 안에 넣을 매물 사진. 인증이 끝난 blob URL만 받는다. */
  photoUrl?: string;
  actionable?: boolean;
};

export type MapRadiusCircle = {
  radiusMeters: 500 | 1000 | 2000;
  label: string;
};

type MapCanvasProps = {
  config: PublicConfig;
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
const toNaverZoom = (level: number): number => clamp(NAVER_ZOOM_BASE - level, 6, 21);
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
  createMap: (container, center, level) =>
    new window.naver!.maps.Map(container, {
      center: new window.naver!.maps.LatLng(center.latitude, center.longitude),
      zoom: toNaverZoom(level),
    }),
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
    element.style.transform = 'translate(-50%, -50%)';
    element.style.zIndex = String(zIndex);
    overlay.setPosition?.(position);
    overlay.onAdd = () => overlay.getPanes?.().overlayLayer.append(element);
    overlay.draw = () => {
      const projection = overlay.getProjection?.();
      if (projection !== undefined && overlay.getPanes !== undefined) {
        const pixel = projection.fromCoordToOffset(position);
        element.style.left = `${pixel.x}px`;
        element.style.top = `${pixel.y}px`;
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

const markerSymbol = (marker: MapMarker): string => {
  if (marker.tone === 'cluster' || marker.tone === 'propertyCluster') return String(marker.count ?? '');
  if (marker.tone === 'property' || marker.tone === 'selected') return '⌂';
  return '•';
};

/** 현재 위치는 지도 앱 관례대로 글리프 없는 파란 점 하나로 그린다. */
const isCurrentLocationDot = (marker: MapMarker): boolean => marker.tone === 'current';

const usesCategoryIcon = (marker: MapMarker): boolean =>
  (marker.tone === 'place' || marker.tone === 'cluster') && marker.category !== undefined;

/** 매물·매물 군집 마커는 대표 사진을 받았을 때 그 사진을 마커 안에 넣는다. */
const usesPhoto = (marker: MapMarker): boolean =>
  (marker.tone === 'property' || marker.tone === 'selected' || marker.tone === 'propertyCluster') &&
  marker.photoUrl !== undefined;

/** 묶음 숫자 배지. 사진이 없는 매물 군집은 숫자를 마커 본문에 그대로 쓰므로 배지를 겹치지 않는다. */
const usesCountBadge = (marker: MapMarker): boolean =>
  marker.count !== undefined &&
  (marker.category !== undefined || (marker.tone === 'propertyCluster' && marker.photoUrl !== undefined));

const markerClassName = (marker: MapMarker, selectedMarkerId: string | null): string =>
  [
    styles.marker,
    marker.tone === 'property' ? styles.propertyMarker : '',
    marker.tone === 'current' ? styles.currentMarker : '',
    marker.tone === 'selected' ? styles.selectedMarker : '',
    marker.tone === 'place' ? styles.placeMarker : '',
    marker.tone === 'cluster' ? styles.clusterMarker : '',
    marker.tone === 'propertyCluster' ? styles.propertyClusterMarker : '',
    selectedMarkerId === marker.id ? styles.activeMarker : '',
  ]
    .filter(Boolean)
    .join(' ');

const createMarkerContent = (
  marker: MapMarker,
  selectedMarkerId: string | null,
  onSelectMarker?: (marker: MapMarker) => void,
): HTMLElement => {
  const canSelect = marker.actionable === true && onSelectMarker !== undefined;
  const element = document.createElement(canSelect ? 'button' : 'div');
  element.className = markerClassName(marker, selectedMarkerId);
  element.dataset.tone = marker.tone ?? 'property';
  if (marker.category !== undefined) element.dataset.category = marker.category;
  element.setAttribute('aria-label', marker.label);
  if (!canSelect) element.setAttribute('role', 'img');
  else {
    element.setAttribute('type', 'button');
    element.addEventListener('click', (event) => {
      event.stopPropagation();
      onSelectMarker(marker);
    });
  }

  if (isCurrentLocationDot(marker)) {
    // 점 자체가 표시라서 안에 넣을 내용이 없다.
  } else if (usesCategoryIcon(marker) && marker.category !== undefined) {
    element.append(createMapCategoryIconElement(marker.category, styles.categoryIcon));
  } else if (usesPhoto(marker) && marker.photoUrl !== undefined) {
    const photo = document.createElement('img');
    photo.className = styles.markerPhoto;
    photo.src = marker.photoUrl;
    photo.alt = '';
    photo.draggable = false;
    element.append(photo);
  } else {
    const icon = document.createElement(marker.tone === 'cluster' ? 'strong' : 'span');
    icon.className = styles.markerIcon;
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = markerSymbol(marker);
    element.append(icon);
  }

  if (usesCountBadge(marker)) {
    const count = document.createElement('strong');
    count.className = styles.markerCount;
    count.textContent = String(marker.count);
    element.append(count);
  }

  if (marker.tone === 'selected' || marker.tone === 'property') {
    const caption = document.createElement('span');
    caption.className = styles.markerCaption;
    caption.textContent = marker.caption ?? marker.label;
    element.append(caption);
  }
  return element;
};

const demoMarkerStyle = (marker: MapMarker, center: { latitude: number; longitude: number }): CSSProperties => ({
  left: `${clamp(50 + (marker.longitude - center.longitude) * 3_100, 9, 91)}%`,
  top: `${clamp(50 - (marker.latitude - center.latitude) * 4_200, 10, 88)}%`,
});

const MapCanvas = ({
  config,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LiveMap | null>(null);
  const overlaysRef = useRef<LiveOverlay[]>([]);
  const circlesRef = useRef<LiveOverlay[]>([]);
  const callbackRef = useRef({ onSelectLocation, onCenterChange, onLevelChange });
  const [mapReady, setMapReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);
  const engine = useMemo(() => naverEngine(config.naverMapClientId ?? ''), [config.naverMapClientId]);
  const liveMode = config.mapProviderMode === 'naver' && (config.naverMapClientId ?? '') !== '';

  callbackRef.current = { onSelectLocation, onCenterChange, onLevelChange };

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
        map = engine.createMap(containerRef.current, center, level);
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
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      circlesRef.current.forEach((circle) => circle.setMap(null));
      overlaysRef.current = [];
      circlesRef.current = [];
      mapRef.current = null;
    };
  }, [engine, liveMode]);

  useEffect(() => {
    if (!liveMode || !mapReady || mapRef.current === null) return;
    const current = engine.getCenter(mapRef.current);
    if (
      Math.abs(current.latitude - center.latitude) < 0.0000001 &&
      Math.abs(current.longitude - center.longitude) < 0.0000001
    )
      return;
    engine.setCenter(mapRef.current, engine.latLng(center.latitude, center.longitude));
  }, [center.latitude, center.longitude, engine, liveMode, mapReady]);

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
  }, [center.latitude, center.longitude, engine, liveMode, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!liveMode || !mapReady || map === null || engine.getZoom(map) === level) return;
    engine.setZoom(map, level);
  }, [engine, level, liveMode, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!liveMode || !mapReady || map === null) return;
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = markers.map((marker) =>
      engine.createOverlay(
        map,
        marker,
        createMarkerContent(marker, selectedMarkerId, onSelectMarker),
        selectedMarkerId === marker.id
          ? 10
          : marker.tone === 'selected'
            ? 9
            : marker.tone === 'property'
              ? 8
              : marker.tone === 'current'
                ? 7
                : 5,
      ),
    );
    return () => {
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];
    };
  }, [engine, liveMode, mapReady, markers, onSelectMarker, selectedMarkerId]);

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
        const latitude = center.latitude + (0.5 - (event.clientY - rect.top) / rect.height) * 0.018;
        const longitude = center.longitude + ((event.clientX - rect.left) / rect.width - 0.5) * 0.024;
        onSelectLocation(latitude, longitude);
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
              style={{ width: `${(circle.radiusMeters / 2000) * 84}%` }}
              aria-hidden="true"
            />
          ))}
          {markers.map((marker) => {
            const markerNode = (
              <>
                {isCurrentLocationDot(marker) ? null : usesCategoryIcon(marker) && marker.category !== undefined ? (
                  <MapCategoryIcon category={marker.category} className={styles.categoryIcon} />
                ) : usesPhoto(marker) ? (
                  <img className={styles.markerPhoto} src={marker.photoUrl} alt="" draggable={false} />
                ) : (
                  <span className={styles.markerIcon} aria-hidden="true">
                    {markerSymbol(marker)}
                  </span>
                )}
                {usesCountBadge(marker) && <strong className={styles.markerCount}>{marker.count}</strong>}
                {(marker.tone === 'selected' || marker.tone === 'property') && (
                  <span className={styles.markerCaption}>{marker.caption ?? marker.label}</span>
                )}
              </>
            );
            const className = markerClassName(marker, selectedMarkerId);
            const canSelect = marker.actionable === true && onSelectMarker !== undefined;
            return !canSelect ? (
              <div
                key={marker.id}
                className={`${styles.demoMarkerPosition} ${className}`}
                data-tone={marker.tone ?? 'property'}
                data-category={marker.category}
                style={demoMarkerStyle(marker, center)}
                role="img"
                aria-label={marker.label}
              >
                {markerNode}
              </div>
            ) : (
              <button
                key={marker.id}
                type="button"
                className={`${styles.demoMarkerPosition} ${className}`}
                data-tone={marker.tone ?? 'property'}
                data-category={marker.category}
                style={demoMarkerStyle(marker, center)}
                aria-label={marker.label}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectMarker(marker);
                }}
              >
                {markerNode}
              </button>
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
