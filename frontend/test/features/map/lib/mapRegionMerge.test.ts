import type { Position } from 'geojson';
import { describe, expect, it } from 'vitest';

import {
  mergeRegionsByAppearance,
  overlayFillOpacity,
  regionAtPoint,
  regionGeometry,
} from '@/features/map/lib/mapRegionMerge';
import type { MapRegion } from '@/features/map/model/MapCanvas';

type Point = { latitude: number; longitude: number };
/** 경도 x, 위도 y 사각형. 기본은 시계 방향(남서 → 북서 → 북동 → 남동)이다. */
const square = (south: number, west: number, size: number, clockwise = true): Point[] => {
  const corners = [
    { latitude: south, longitude: west },
    { latitude: south + size, longitude: west },
    { latitude: south + size, longitude: west + size },
    { latitude: south, longitude: west + size },
  ];
  const ring = clockwise ? corners : [...corners].reverse();
  return [...ring, ring[0]];
};
/** 경도를 x, 위도를 y로 본 넓이 부호. 양수면 반시계 방향이다. */
const signedArea = (ring: Position[]) => {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return sum / 2;
};
const region = (id: string, polygons: Point[][][], extra: Partial<MapRegion> = {}): MapRegion => ({
  id,
  name: id,
  paths: [],
  polygons,
  ...extra,
});
const style = (fillColor: string, fillOpacity = 0.28) => ({
  strokeColor: '#222222',
  strokeWeight: 1.25,
  fillColor,
  fillOpacity,
  zIndex: 1,
});
const colorOf = (item: MapRegion) => style(item.appearance?.fillColor ?? '#000000');
const red = { fillColor: '#ff0000', strokeColor: '#222222' };
const blue = { fillColor: '#0000ff', strokeColor: '#222222' };

describe('mergeRegionsByAppearance', () => {
  it('같은 스타일의 동을 처음 나온 순서대로 MultiPolygon 하나에 모은다', () => {
    const groups = mergeRegionsByAppearance(
      [
        region('a', [[square(37, 127, 0.01)]], { appearance: red }),
        region('b', [[square(37.1, 127, 0.01)]], { appearance: blue }),
        region('c', [[square(37.2, 127, 0.01)], [square(37.3, 127, 0.01)]], { appearance: red }),
      ],
      4,
      colorOf,
    );
    expect(groups.map((group) => group.regionIds)).toEqual([['a', 'c'], ['b']]);
    expect(groups[0].style).toEqual(style('#ff0000'));
    expect(groups[0].key).not.toBe(groups[1].key);
    expect(groups[0].geometry.type).toBe('MultiPolygon');
    // a의 면 하나와 c의 면 두 개
    expect(groups[0].geometry.coordinates).toHaveLength(3);
    expect(groups[0].geometry.coordinates[0][0][0]).toEqual([127, 37]);
  });

  it('확대 단계에 맞는 상세 좌표를 고르고 좌표 키에 단계를 넣는다', () => {
    const detailed = region('a', [[square(37, 127, 0.01)]], {
      simplifiedPolygons: { overview: [[square(37, 128, 0.01)]], medium: [[square(37, 129, 0.01)]] },
    });
    const at = (level: number) => mergeRegionsByAppearance([detailed], level, colorOf)[0];
    expect(at(8).geometry.coordinates[0][0][0]).toEqual([128, 37]);
    expect(at(6).geometry.coordinates[0][0][0]).toEqual([129, 37]);
    expect(at(4).geometry.coordinates[0][0][0]).toEqual([127, 37]);
    expect(at(8).geometryKey).not.toBe(at(6).geometryKey);
    expect(at(8).geometryKey).toBe(at(10).geometryKey);
  });

  it('바깥 고리는 반시계, 구멍은 시계 방향으로 맞추고 원본 좌표는 바꾸지 않는다', () => {
    const outer = square(37, 127, 0.1, true);
    const hole = square(37.04, 127.04, 0.02, false);
    const before = JSON.stringify([outer, hole]);
    const [group] = mergeRegionsByAppearance([region('a', [[outer, hole]])], 4, colorOf);
    const [rewoundOuter, rewoundHole] = group.geometry.coordinates[0];
    expect(signedArea(rewoundOuter)).toBeGreaterThan(0);
    expect(signedArea(rewoundHole)).toBeLessThan(0);
    expect(JSON.stringify([outer, hole])).toBe(before);
  });

  it('빈 면은 빼고 polygons가 없으면 paths를 면 하나로 쓴다', () => {
    const [group] = mergeRegionsByAppearance(
      [region('a', [[square(37, 127, 0.01)], [], [[]]]), { id: 'b', name: 'b', paths: [square(37.1, 127, 0.01)] }],
      4,
      colorOf,
    );
    expect(group.geometry.coordinates).toHaveLength(2);
  });
});

describe('regionAtPoint', () => {
  const donut = region('donut', [[square(37, 127, 0.1), square(37.04, 127.04, 0.02)]]);
  const island = region('island', [[square(37.045, 127.045, 0.01)]]);

  it('면 안을 누르면 그 동을, 경계 밖을 누르면 undefined를 돌려준다', () => {
    expect(regionAtPoint([donut], { latitude: 37.01, longitude: 127.01 }, 4)).toBe('donut');
    expect(regionAtPoint([donut], { latitude: 37.2, longitude: 127.01 }, 4)).toBeUndefined();
    expect(regionAtPoint([donut], { latitude: 37.01, longitude: 127.2 }, 4)).toBeUndefined();
  });

  it('구멍 안은 그 동이 아니고, 구멍 안에 다른 동이 있으면 그 동을 고른다', () => {
    const inHole = { latitude: 37.042, longitude: 127.042 };
    expect(regionAtPoint([donut], inHole, 4)).toBeUndefined();
    expect(regionAtPoint([donut, island], { latitude: 37.05, longitude: 127.05 }, 4)).toBe('island');
  });

  it('여러 면으로 나뉜 동은 어느 면을 눌러도 그 동이다', () => {
    const split = region('split', [[square(37, 127, 0.01)], [square(38, 127, 0.01)]]);
    expect(regionAtPoint([split], { latitude: 38.005, longitude: 127.005 }, 4)).toBe('split');
  });

  it('확대 단계의 상세 좌표로 판정한다', () => {
    const detailed = region('a', [[square(37, 127, 0.01)]], {
      simplifiedPolygons: { overview: [[square(37, 128, 0.01)]], medium: [[square(37, 128, 0.01)]] },
    });
    expect(regionAtPoint([detailed], { latitude: 37.005, longitude: 128.005 }, 8)).toBe('a');
    expect(regionAtPoint([detailed], { latitude: 37.005, longitude: 128.005 }, 4)).toBeUndefined();
  });
});

it('regionGeometry는 같은 좌표 배열이면 변환 결과를 다시 쓴다', () => {
  const item = region('a', [[square(37, 127, 0.01)]]);
  expect(regionGeometry(item, 4).coordinates).toBe(regionGeometry({ ...item }, 3).coordinates);
});

it('overlayFillOpacity는 같은 색을 한 겹 더 칠해 합친 투명도가 목표가 되게 한다', () => {
  const base = style('#ff0000', 0.28);
  const opacity = overlayFillOpacity(base, style('#ff0000', 0.38));
  expect(base.fillOpacity + opacity * (1 - base.fillOpacity)).toBeCloseTo(0.38);
  expect(overlayFillOpacity(base, style('#ff0000', 0.2))).toBe(0);
  expect(overlayFillOpacity(base, style('#00ff00', 0.5))).toBe(0.5);
  expect(overlayFillOpacity(style('#ff0000', 1), style('#ff0000', 1))).toBe(1);
});
