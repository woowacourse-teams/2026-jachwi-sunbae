import type { MapRegion } from '../model/MapCanvas';
import {
  mergeRegionsByAppearance,
  overlayFillOpacity,
  regionAtPoint,
  regionGeometry,
  type RegionGroupStyle,
} from './mapRegionMerge';
import type { LiveMap } from './naverMapEngine';

type Point = { latitude: number; longitude: number };
type PointerEvent = { coord?: { lat?: () => number; lng?: () => number } };
type StyleOf = (region: MapRegion, selected: boolean) => RegionGroupStyle;
type Focus = { id: string; style: RegionGroupStyle; coordinates: unknown };

/** 마우스를 올린 동은 채움을 이만큼 더 진하게 한다. */
export const HOVER_FILL_OPACITY = 0.1;
const FOCUS_ID_PREFIX = 'focus:';

/** 지도 클릭, 이동 이벤트에서 좌표를 읽는다. SDK가 좌표를 주지 않으면 undefined다. */
export const eventPoint = (event?: PointerEvent): Point | undefined => {
  const latitude = event?.coord?.lat?.();
  const longitude = event?.coord?.lng?.();
  return latitude !== undefined && longitude !== undefined && Number.isFinite(latitude) && Number.isFinite(longitude)
    ? { latitude, longitude }
    : undefined;
};

/**
 * 동 경계를 색 구간별로 합쳐 Data 레이어 하나에 그린다. 동마다 도형을 만들면 GL 지도가 매 프레임 도형 수만큼 타일 계산을 해서
 * 끌기가 느려진다. 고른 동과 마우스를 올린 동은 그 동 하나만 위에 따로 그려, 고르거나 hover해도 큰 묶음을 다시 넣지 않는다.
 */
export const createRegionDataLayer = (
  map: LiveMap,
  sdk: NaverMapsNamespace,
  styleOf: StyleOf,
  onSelect: (id: string, point?: Point) => void,
  getLevel: () => number,
  removeListener: (listener: unknown) => void,
) => {
  let layer: NaverData | null = null;
  let regions: MapRegion[] = [];
  let selectedId: string | null = null;
  let hoveredId: string | undefined;
  let hoverPoint: Point | undefined;
  let hoverFrame: number | null = null;
  let dragging = false;
  const listeners: unknown[] = [];
  /** 지도에 올린 묶음 키와 그 좌표 키. */
  const groups = new Map<string, string>();
  let focused: Focus[] = [];

  const removeById = (data: NaverData, id: string) => {
    const feature = data.getFeatureById(id);
    if (feature) data.removeFeature(feature);
  };

  const drawFocus = (data: NaverData, force: boolean) => {
    const level = getLevel();
    const next: Focus[] = [];
    for (const id of new Set([selectedId, hoveredId])) {
      const region = id ? regions.find((item) => item.id === id) : undefined;
      if (!region) continue;
      const base = styleOf(region, false);
      const target = styleOf(region, region.id === selectedId);
      if (region.id === hoveredId) target.fillOpacity += HOVER_FILL_OPACITY;
      const geometry = regionGeometry(region, level);
      next.push({
        id: region.id,
        style: {
          ...target,
          fillOpacity: overlayFillOpacity(base, target),
          zIndex: Math.max(target.zIndex, base.zIndex + 1),
        },
        coordinates: geometry.coordinates,
      });
    }
    const same =
      next.length === focused.length &&
      next.every(
        (item, index) =>
          item.id === focused[index].id &&
          item.coordinates === focused[index].coordinates &&
          JSON.stringify(item.style) === JSON.stringify(focused[index].style),
      );
    if (same && !force) return;
    focused.forEach((item) => removeById(data, FOCUS_ID_PREFIX + item.id));
    focused = next;
    if (next.length === 0) return;
    data.addGeoJson({
      type: 'FeatureCollection',
      features: next.map((item) => ({
        type: 'Feature',
        id: FOCUS_ID_PREFIX + item.id,
        properties: { style: item.style },
        geometry: { type: 'MultiPolygon', coordinates: item.coordinates },
      })),
    });
  };

  const updateHover = () => {
    hoverFrame = null;
    const id = hoverPoint && !dragging ? regionAtPoint(regions, hoverPoint, getLevel()) : undefined;
    if (id === hoveredId) return;
    hoveredId = id;
    if (layer) drawFocus(layer, false);
  };
  const scheduleHover = (point: Point | undefined) => {
    hoverPoint = point;
    hoverFrame ??= requestAnimationFrame(updateHover);
  };

  const ensureLayer = () => {
    if (layer) return layer;
    const data = new sdk.Data();
    data.setStyle((feature) => ({ ...(feature.getProperty('style') as object), clickable: true }));
    listeners.push(
      sdk.Event.addListener(data, 'click', (event) => {
        const point = eventPoint(event);
        const id = point ? regionAtPoint(regions, point, getLevel()) : undefined;
        if (id) onSelect(id, point);
      }),
      // 합친 도형은 동 경계를 넘나들어도 도형 이벤트가 나지 않아 지도 위 마우스 좌표로 동을 찾는다.
      sdk.Event.addListener(map, 'mousemove', (event) => {
        if (!dragging) scheduleHover(eventPoint(event));
      }),
      sdk.Event.addListener(map, 'mouseout', () => scheduleHover(undefined)),
      sdk.Event.addListener(map, 'dragstart', () => {
        dragging = true;
        scheduleHover(undefined);
      }),
      sdk.Event.addListener(map, 'dragend', () => {
        dragging = false;
      }),
    );
    data.setMap(map);
    layer = data;
    return data;
  };

  return {
    sync: (nextRegions: MapRegion[], nextSelectedId: string | null) => {
      regions = nextRegions;
      selectedId = nextSelectedId;
      if (!layer && regions.length === 0) return;
      const data = ensureLayer();
      const merged = mergeRegionsByAppearance(regions, getLevel(), (region) => styleOf(region, false));
      const keep = new Set(merged.map((group) => group.key));
      for (const key of [...groups.keys()]) {
        if (keep.has(key)) continue;
        removeById(data, key);
        groups.delete(key);
      }
      const added = merged.filter((group) => groups.get(group.key) !== group.geometryKey);
      for (const group of added) {
        if (groups.has(group.key)) removeById(data, group.key);
        groups.set(group.key, group.geometryKey);
      }
      if (added.length > 0)
        data.addGeoJson({
          type: 'FeatureCollection',
          features: added.map((group) => ({
            type: 'Feature',
            id: group.key,
            properties: { style: group.style },
            geometry: group.geometry,
          })),
        });
      if (hoveredId && !regions.some((region) => region.id === hoveredId)) hoveredId = undefined;
      // 묶음을 새로 넣으면 그 위에 고른 동이 다시 오도록 따로 그린 동도 다시 넣는다.
      drawFocus(data, added.length > 0);
    },
    dispose: (sdkUnavailable = false) => {
      if (hoverFrame !== null) cancelAnimationFrame(hoverFrame);
      hoverFrame = null;
      if (!sdkUnavailable) {
        listeners.forEach(removeListener);
        layer?.setMap(null);
      }
      listeners.length = 0;
      layer = null;
      groups.clear();
      focused = [];
    },
  };
};
