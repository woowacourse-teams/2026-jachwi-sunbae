// 행정동 경계를 색 구간별로 묶는 데이터 단계 함수. 지도 SDK를 모르고 위도, 경도와 GeoJSON 좌표만 다룬다.
// 결과는 GeoJSON MultiPolygon이라 네이티브 지도도 같은 결과를 받아 그 SDK 방식으로 그리면 된다.
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import rewind from '@turf/rewind';
import type { MultiPolygon, Polygon, Position } from 'geojson';

import type { MapRegion } from '../model/MapCanvas';

type Point = { latitude: number; longitude: number };
type RegionPolygons = NonNullable<MapRegion['polygons']>;

export type RegionGroupStyle = {
  strokeColor: string;
  strokeWeight: number;
  fillColor: string;
  fillOpacity: number;
  zIndex: number;
};

export type MergedRegionGroup = {
  /** 스타일이 같으면 같은 키. 지도에 올린 도형을 다시 쓸지 정할 때 쓴다. */
  key: string;
  style: RegionGroupStyle;
  regionIds: string[];
  geometry: MultiPolygon;
  /** 좌표가 바뀌었는지 싸게 비교하는 값(상세 단계와 동 id). */
  geometryKey: string;
};

type DetailTier = 'overview' | 'medium' | 'full';
/** 앱 축척 8 이상은 overview, 5~7은 medium, 4 이하는 원본 좌표를 쓴다. */
const detailTier = (level: number): DetailTier => (level >= 8 ? 'overview' : level >= 5 ? 'medium' : 'full');

/** 확대 단계에 맞는 상세 좌표로 바꾼 동. 상세 좌표가 없으면 원본을 그대로 돌려준다. */
export const regionAtLevel = (region: MapRegion, level: number): MapRegion => {
  const tier = detailTier(level);
  const detail = tier === 'full' ? undefined : region.simplifiedPolygons?.[tier];
  return detail ? { ...region, polygons: detail } : region;
};

type Shape = { polygons: Position[][][]; bbox: [number, number, number, number] };
// 같은 좌표 배열은 확대 단계를 오가거나 필터를 바꿔 다시 묶어도 한 번만 변환한다.
const shapes = new WeakMap<RegionPolygons, Shape>();

/**
 * 동 좌표를 GeoJSON 면 목록으로 바꾼다. 빈 면은 빼고, 고리 방향은 RFC 7946대로 바깥 반시계, 구멍 시계로 맞춘다.
 * GL 지도가 고리 방향으로 면과 구멍을 가르기 때문이다.
 */
const shapeOf = (polygons: RegionPolygons): Shape => {
  const cached = shapes.get(polygons);
  if (cached) return cached;
  const bbox: Shape['bbox'] = [Infinity, Infinity, -Infinity, -Infinity];
  const converted = polygons
    .filter((polygon) => polygon.length > 0 && polygon[0].length > 0)
    .map((polygon) => {
      const geometry: Polygon = {
        type: 'Polygon',
        coordinates: polygon.map((ring) =>
          ring.map(({ latitude, longitude }) => {
            bbox[0] = Math.min(bbox[0], longitude);
            bbox[1] = Math.min(bbox[1], latitude);
            bbox[2] = Math.max(bbox[2], longitude);
            bbox[3] = Math.max(bbox[3], latitude);
            return [longitude, latitude];
          }),
        ),
      };
      return (rewind(geometry, { mutate: true }) as Polygon).coordinates;
    });
  const shape = { polygons: converted, bbox };
  shapes.set(polygons, shape);
  return shape;
};

// polygons가 없는 동은 paths 배열을 키로 삼아, 면 하나로 감싼 새 배열 때문에 매번 다시 변환하지 않게 한다.
const pathShapes = new WeakMap<MapRegion['paths'], Shape>();
const regionShape = (region: MapRegion, level: number) => {
  const atLevel = regionAtLevel(region, level);
  if (atLevel.polygons) return shapeOf(atLevel.polygons);
  let shape = pathShapes.get(atLevel.paths);
  if (!shape) {
    shape = shapeOf([atLevel.paths]);
    pathShapes.set(atLevel.paths, shape);
  }
  return shape;
};

/** 동 하나의 GeoJSON MultiPolygon. 고른 동이나 hover한 동을 위에 따로 그릴 때 쓴다. */
export const regionGeometry = (region: MapRegion, level: number): MultiPolygon => ({
  type: 'MultiPolygon',
  coordinates: regionShape(region, level).polygons,
});

/**
 * 같은 스타일(채움색, 테두리색, 투명도)의 동을 MultiPolygon 하나로 묶는다. 처음 나온 순서대로 묶음을 돌려준다.
 * 경계를 녹여 합치지 않고 면을 모으기만 해서 동 사이 테두리는 그대로 보인다.
 */
export const mergeRegionsByAppearance = (
  regions: MapRegion[],
  level: number,
  styleOf: (region: MapRegion) => RegionGroupStyle,
): MergedRegionGroup[] => {
  const groups = new Map<string, MergedRegionGroup>();
  const tier = detailTier(level);
  for (const region of regions) {
    const style = styleOf(region);
    const key = JSON.stringify(style);
    let group = groups.get(key);
    if (!group) {
      group = { key, style, regionIds: [], geometry: { type: 'MultiPolygon', coordinates: [] }, geometryKey: '' };
      groups.set(key, group);
    }
    group.regionIds.push(region.id);
    group.geometry.coordinates.push(...regionShape(region, level).polygons);
  }
  for (const group of groups.values()) group.geometryKey = `${tier}:${group.regionIds.join(',')}`;
  return [...groups.values()];
};

/** 합친 도형을 눌렀을 때 어느 동인지 찾는다. 동마다 도형 객체가 없어서 좌표로 가린다. 경계선 위는 안으로 본다. */
export const regionAtPoint = (regions: MapRegion[], point: Point, level: number): string | undefined => {
  const position = [point.longitude, point.latitude];
  return regions.find((region) => {
    const { polygons, bbox } = regionShape(region, level);
    if (position[0] < bbox[0] || position[1] < bbox[1] || position[0] > bbox[2] || position[1] > bbox[3]) return false;
    return booleanPointInPolygon(position, { type: 'MultiPolygon', coordinates: polygons });
  })?.id;
};

/**
 * 아래 묶음 위에 같은 색으로 한 겹 더 칠해 합친 투명도가 `target`이 되게 하는 위 겹의 투명도.
 * 색이 다르면 섞는 계산이 맞지 않아 `target`을 그대로 쓴다.
 */
export const overlayFillOpacity = (base: RegionGroupStyle, target: RegionGroupStyle) => {
  if (base.fillColor !== target.fillColor || base.fillOpacity >= 1) return target.fillOpacity;
  return Math.max(0, (target.fillOpacity - base.fillOpacity) / (1 - base.fillOpacity));
};
