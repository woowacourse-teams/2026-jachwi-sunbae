import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMapRegionLayer } from '@/features/map/lib/mapRegionLayer';
import { regionAtLevel } from '@/features/map/lib/mapRegionMerge';
import type { MapRegion } from '@/features/map/model/MapCanvas';

it('앱 축척 8 이상은 overview, 5~7은 medium, 4 이하는 원본을 고른다', () => {
  const original = [[[{ latitude: 37, longitude: 127 }]]];
  const overview = [[[{ latitude: 37.1, longitude: 127 }]]];
  const medium = [[[{ latitude: 37.2, longitude: 127 }]]];
  const region: MapRegion = {
    id: 'a',
    name: '동',
    paths: [],
    polygons: original,
    simplifiedPolygons: { overview, medium },
  };
  expect(regionAtLevel(region, 10).polygons).toBe(overview);
  expect(regionAtLevel(region, 8).polygons).toBe(overview);
  expect(regionAtLevel(region, 7).polygons).toBe(medium);
  expect(regionAtLevel(region, 5).polygons).toBe(medium);
  expect(regionAtLevel(region, 4).polygons).toBe(original);
  expect(regionAtLevel({ ...region, simplifiedPolygons: undefined }, 10).polygons).toBe(original);
});

type Point = { latitude: number; longitude: number };
type Listener = { target: unknown; event: string; callback: (event?: unknown) => void };
type FakeFeature = {
  id: string;
  properties: { style: Record<string, unknown> };
  geometry: { type: string; coordinates: number[][][][] };
};

/** 실제 SDK 대신 생성자 옵션과 호출만 기록한다. */
const setup = ({
  ready = (): boolean => true,
  center = { latitude: 37.5, longitude: 127 },
}: { ready?: () => boolean; center?: Point } = {}) => {
  const polygons: FakePolygon[] = [];
  const listeners: Listener[] = [];
  const overlays: {
    marker: { id: string; latitude: number; longitude: number };
    content: HTMLElement;
    setMap: ReturnType<typeof vi.fn>;
  }[] = [];
  const dataLayers: FakeData[] = [];
  class FakeData {
    features = new Map<string, FakeFeature>();
    setMap = vi.fn();
    setStyle = vi.fn();
    addGeoJson = vi.fn((json: { features: FakeFeature[] }) => {
      json.features.forEach((feature) => this.features.set(feature.id, feature));
      return json.features;
    });
    getFeatureById = (id: string) => this.features.get(id);
    removeFeature = vi.fn((feature: FakeFeature) => this.features.delete(feature.id));
    constructor() {
      dataLayers.push(this);
    }
  }
  class FakePolygon {
    setPaths = vi.fn();
    setOptions = vi.fn();
    setMap = vi.fn();
    constructor(
      readonly options: {
        paths: { lat: number; lng: number }[][];
        fillColor: string;
        fillOpacity: number;
        strokeColor: string;
        strokeWeight: number;
        zIndex: number;
        clickable: boolean;
      },
    ) {
      polygons.push(this);
    }
  }
  const sdk = {
    Polygon: FakePolygon,
    Data: FakeData,
    Event: {
      addListener: (target: unknown, event: string, callback: (event?: unknown) => void) => {
        const listener = { target, event, callback };
        listeners.push(listener);
        return listener;
      },
    },
  } as unknown as NaverMapsNamespace;
  const engine = {
    latLng: (lat: number, lng: number) => ({ lat, lng }),
    createOverlay: vi.fn(
      (_map: unknown, marker: { id: string; latitude: number; longitude: number }, content: HTMLElement) => {
        const overlay = { marker, content, setMap: vi.fn() };
        overlays.push(overlay);
        return overlay;
      },
    ),
    removeListener: vi.fn(),
    isRenderReady: vi.fn(ready),
    getCenter: () => center,
  };
  const frames: FrameRequestCallback[] = [];
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => frames.push(callback));
  const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  const flush = () => {
    for (let i = 0; i < 2; i++) frames.splice(0).forEach((callback) => callback(0));
  };
  const onSelect = vi.fn();
  let level = 4;
  const map = {};
  const layer = createMapRegionLayer(map as never, sdk, engine as never, onSelect, () => level);
  const fire = (target: unknown, event: string, value?: unknown) =>
    listeners.filter((item) => item.target === target && item.event === event).forEach((item) => item.callback(value));
  /** SDK 지도 이벤트처럼 좌표를 lat(), lng()로 준다. */
  const at = (latitude: number, longitude: number) => ({ coord: { lat: () => latitude, lng: () => longitude } });
  return {
    layer,
    map,
    at,
    dataLayers,
    polygons,
    listeners,
    overlays,
    engine,
    flush,
    frames,
    cancel,
    onSelect,
    fire,
    setLevel: (next: number) => (level = next),
  };
};
const ring = (latitude: number, longitude = 127): Point[] => [
  { latitude, longitude },
  { latitude: latitude + 0.001, longitude },
  { latitude, longitude: longitude + 0.001 },
  { latitude, longitude },
];
/** 요약 이름표가 없는 동. 색 구간별로 합쳐 Data 레이어에 그린다. */
const plain = (id: string, extra: Partial<MapRegion> = {}): MapRegion => ({
  id,
  name: id,
  paths: [ring(37.5)],
  ...extra,
});
/** 요약 이름표가 있는 동. 동마다 도형을 만든다. */
const region = (id: string, extra: Partial<MapRegion> = {}): MapRegion =>
  plain(id, { summary: { price: '1만원' }, ...extra });

afterEach(() => vi.restoreAllMocks());

describe('요약 이름표가 있는 경계 레이어', () => {
  it('색이 없는 경계는 추천·선택 여부로 기본 스타일을 정하고 클릭할 수 있다', () => {
    const { layer, polygons } = setup();
    layer.sync(
      [
        region('추천', { isRecommended: true }),
        region('비추천', { isRecommended: false }),
        region('선택', { isRecommended: false }),
      ],
      '선택',
    );
    expect(polygons[0].options).toMatchObject({
      fillColor: '#f5c344',
      fillOpacity: 0.24,
      strokeColor: '#a4a7ab',
      strokeWeight: 1,
      zIndex: 1,
      clickable: true,
    });
    expect(polygons[1].options).toMatchObject({ fillColor: '#888888', fillOpacity: 0.08 });
    expect(polygons[2].options).toMatchObject({
      fillColor: '#f5c344',
      fillOpacity: 0.5,
      strokeColor: '#787b80',
      strokeWeight: 2,
      zIndex: 2,
    });
  });

  it('같은 호버 상태는 다시 적용하지 않고 벗어나면 원래 투명도로 돌린다', () => {
    const { layer, polygons, fire } = setup();
    layer.sync([region('a', { appearance: { fillColor: '#111111', strokeColor: '#222222' } })], null);
    fire(polygons[0], 'mouseover');
    fire(polygons[0], 'mouseover');
    expect(polygons[0].setOptions).toHaveBeenCalledOnce();
    expect(polygons[0].setOptions.mock.lastCall?.[0].fillOpacity).toBeCloseTo(0.38);
    fire(polygons[0], 'mouseout');
    expect(polygons[0].setOptions).toHaveBeenLastCalledWith({ fillOpacity: 0.28 });
  });

  it('호버 중 선택 스타일이 바뀌어도 호버만큼 진한 투명도를 유지한다', () => {
    const { layer, polygons, fire } = setup();
    const regions = [region('a', { appearance: { fillColor: '#111111', strokeColor: '#222222' } })];
    layer.sync(regions, null);
    fire(polygons[0], 'mouseover');
    layer.sync(regions, 'a');
    expect(polygons[0].setOptions.mock.lastCall?.[0].fillOpacity).toBeCloseTo(0.48);
  });

  it('면 개수가 같으면 좌표만 바꾸고, 다르면 기존 경계와 리스너를 지우고 새로 만든다', () => {
    const { layer, polygons, engine } = setup();
    layer.sync([region('a')], null);
    layer.sync([region('a', { paths: [ring(37.6)] })], null);
    expect(polygons).toHaveLength(1);
    expect(polygons[0].setPaths).toHaveBeenCalledWith([
      [
        { lat: 37.6, lng: 127 },
        { lat: 37.601, lng: 127 },
        { lat: 37.6, lng: 127.001 },
        { lat: 37.6, lng: 127 },
      ],
    ]);
    layer.sync([region('a', { polygons: [[ring(37.6)], [ring(37.7)]] })], null);
    expect(polygons[0].setMap).toHaveBeenCalledWith(null);
    expect(engine.removeListener).toHaveBeenCalledTimes(3);
    expect(polygons.slice(1)).toHaveLength(2);
    expect(polygons[1].options.paths[0][0]).toEqual({ lat: 37.6, lng: 127 });
  });

  it('빈 면은 그리지 않는다', () => {
    const { layer, polygons } = setup();
    layer.sync([region('a', { polygons: [[ring(37.5)], []] })], null);
    expect(polygons).toHaveLength(1);
  });

  it('요약이 있는 동만 라벨을 만들고, 요약이 바뀔 때만 교체하며 라벨 호버·클릭을 경계와 연결한다', () => {
    const { layer, polygons, overlays, onSelect } = setup();
    const priced = region('a', {
      isRecommended: true,
      center: { latitude: 37.55, longitude: 127.05 },
      summary: { price: '50만원' },
    });
    layer.sync([priced, plain('b')], null);
    expect(overlays).toHaveLength(1);
    expect(overlays[0].marker).toMatchObject({ id: 'a', latitude: 37.55, longitude: 127.05 });
    layer.sync([{ ...priced }, plain('b')], null);
    expect(overlays).toHaveLength(1);
    const label = overlays[0].content;
    label.dispatchEvent(new Event('mouseenter'));
    expect(polygons[0].setOptions.mock.lastCall?.[0].fillOpacity).toBeCloseTo(0.34);
    expect(label.dataset.hovered).toBe('true');
    label.dispatchEvent(new Event('mouseleave'));
    expect(label.dataset.hovered).toBe('false');
    label.dispatchEvent(new Event('focus'));
    expect(label.dataset.hovered).toBe('true');
    label.dispatchEvent(new Event('blur'));
    expect(label.dataset.hovered).toBe('false');
    label.click();
    expect(onSelect).toHaveBeenCalledWith('a');
    layer.sync([{ ...priced, summary: { price: '60만원' } }, plain('b')], null);
    expect(overlays[0].setMap).toHaveBeenCalledWith(null);
    expect(overlays).toHaveLength(2);
    layer.sync([{ ...priced, summary: undefined }, plain('b')], null);
    expect(overlays[1].setMap).toHaveBeenCalledWith(null);
    expect(overlays).toHaveLength(2);
    // 이름표가 빠진 동은 동마다 그린 도형을 지우고 합친 도형으로 옮긴다.
    expect(polygons[0].setMap).toHaveBeenCalledWith(null);
  });

  it('GL 지도가 준비되기 전에는 경계를 만들지 않고 준비되면 만든다', () => {
    let ready = false;
    const { layer, polygons, flush } = setup({ ready: () => ready });
    layer.sync([region('a')], null);
    flush();
    expect(polygons).toHaveLength(0);
    ready = true;
    flush();
    expect(polygons).toHaveLength(1);
  });

  it('준비 신호가 끝내 없어도 3초가 지나면 경계를 그린다', () => {
    const now = vi.spyOn(performance, 'now').mockReturnValue(1000);
    const { layer, polygons, flush } = setup({ ready: () => false });
    layer.sync([region('a')], null);
    now.mockReturnValue(3999);
    flush();
    expect(polygons).toHaveLength(0);
    now.mockReturnValue(4000);
    flush();
    expect(polygons).toHaveLength(1);
  });

  it('같은 단계에서는 위도에 맞춘 경도 축척으로 화면 중심에 가까운 동을 먼저 넣는다', () => {
    const { layer, polygons, flush } = setup();
    // 중심(37.5, 127)과 같은 자리의 동 38개를 먼저 채운다.
    const fillers = Array.from({ length: 38 }, (_, index) =>
      region(`f${index}`, { center: { latitude: 37.5, longitude: 127 } }),
    );
    // 경도로 0.012 떨어진 동은 축척(cos 37.5°)을 적용하면 위도로 0.01 떨어진 동보다 가깝다. 중심 좌표가 없으면 첫 면의 첫 점을 쓴다.
    const east = region('east', { polygons: [[ring(37.5, 127.012)]] });
    const north = region('north', { paths: [ring(37.51)] });
    // 위도는 거의 같지만 서쪽으로 멀리 떨어진 동은 마지막이다.
    const farWest = region('farWest', {
      center: { latitude: 37.501, longitude: 126.95 },
      paths: [ring(37.501, 126.95)],
    });
    layer.sync([farWest, north, east, ...fillers], null);
    const first = (paths: { lat: number; lng: number }[][]) => paths[0][0];
    expect(polygons).toHaveLength(40);
    const firstBatch = polygons.map((polygon) => first(polygon.options.paths));
    expect(firstBatch).toContainEqual({ lat: 37.5, lng: 127.012 });
    expect(firstBatch).toContainEqual({ lat: 37.51, lng: 127 });
    expect(firstBatch).not.toContainEqual({ lat: 37.501, lng: 126.95 });
    flush();
    expect(polygons).toHaveLength(41);
    expect(first(polygons[40].options.paths)).toEqual({ lat: 37.501, lng: 126.95 });
  });

  it('새 결과는 다시 나눠 그리고, 일부가 이미 그려진 갱신은 한 번에 반영한다', () => {
    const { layer, polygons, flush } = setup();
    const many = (prefix: string) => Array.from({ length: 41 }, (_, index) => region(`${prefix}${index}`));
    layer.sync(many('a'), null);
    flush();
    expect(polygons).toHaveLength(41);
    layer.sync([...many('a'), ...many('b')], null);
    expect(polygons).toHaveLength(82);
    layer.sync(many('c'), null);
    expect(polygons).toHaveLength(122);
    flush();
    expect(polygons).toHaveLength(123);
  });

  it('나눠 그리는 중에 결과가 바뀌거나 종료하면 예약한 다음 묶음을 취소하고 모두 정리한다', () => {
    const { layer, polygons, cancel, engine, overlays } = setup();
    layer.sync(
      [
        ...Array.from({ length: 41 }, (_, index) => region(`a${index}`)),
        region('label', { summary: { price: '1만원' } }),
      ],
      null,
    );
    layer.dispose();
    expect(cancel).toHaveBeenCalled();
    expect(polygons.every((polygon) => polygon.setMap.mock.calls.some(([value]) => value === null))).toBe(true);
    expect(engine.removeListener).toHaveBeenCalledTimes(polygons.length * 3);
    expect(overlays.every((overlay) => overlay.setMap.mock.calls.some(([value]) => value === null))).toBe(true);
  });
});

describe('합친 경계 레이어', () => {
  const near = { fillColor: '#111111', strokeColor: '#222222' };
  const far = { fillColor: '#333333', strokeColor: '#444444' };
  const three = () => [
    plain('a', { appearance: near }),
    plain('b', { appearance: near, paths: [ring(37.6)] }),
    plain('c', { appearance: far, paths: [ring(37.7)] }),
  ];
  const ids = (layer: { features: Map<string, FakeFeature> }) => [...layer.features.keys()];
  const focus = (layer: { features: Map<string, FakeFeature> }, id: string) => layer.features.get(`focus:${id}`);

  it('요약이 없는 동은 동마다 도형을 만들지 않고 같은 스타일끼리 MultiPolygon 하나로 그린다', () => {
    const { layer, polygons, dataLayers } = setup();
    layer.sync(three(), null);
    expect(polygons).toHaveLength(0);
    expect(dataLayers).toHaveLength(1);
    const [data] = dataLayers;
    expect(data.addGeoJson).toHaveBeenCalledOnce();
    const features = [...data.features.values()];
    expect(features).toHaveLength(2);
    expect(features[0].geometry.type).toBe('MultiPolygon');
    expect(features[0].geometry.coordinates).toHaveLength(2);
    expect(features[0].properties.style).toEqual({
      fillColor: '#111111',
      fillOpacity: 0.28,
      strokeColor: '#222222',
      strokeWeight: 1.25,
      zIndex: 1,
    });
    // Data 레이어 스타일 함수는 feature에 담은 스타일을 그대로 쓰고 클릭을 받는다.
    const styleFn = data.setStyle.mock.lastCall?.[0] as (feature: { getProperty: (key: string) => unknown }) => object;
    expect(styleFn({ getProperty: () => ({ fillColor: '#111111' }) })).toEqual({
      fillColor: '#111111',
      clickable: true,
    });
  });

  it('고른 동은 그 동 하나만 위에 따로 그리고 큰 묶음은 다시 넣지 않는다', () => {
    const { layer, dataLayers } = setup();
    const regions = three();
    layer.sync(regions, null);
    const [data] = dataLayers;
    layer.sync(regions, 'a');
    expect(data.addGeoJson).toHaveBeenCalledTimes(2);
    expect(data.removeFeature).not.toHaveBeenCalled();
    const selected = focus(data, 'a')!;
    expect(selected.properties.style).toMatchObject({ strokeWeight: 2, zIndex: 2, fillColor: '#111111' });
    // 아래 묶음(0.28) 위에 겹쳐 합친 투명도가 고른 동 투명도(0.38)가 된다.
    const overlay = selected.properties.style.fillOpacity as number;
    expect(0.28 + overlay * (1 - 0.28)).toBeCloseTo(0.38);
    layer.sync(regions, 'a');
    expect(data.addGeoJson).toHaveBeenCalledTimes(2);
    layer.sync(regions, null);
    expect(focus(data, 'a')).toBeUndefined();
    expect(ids(data)).toHaveLength(2);
  });

  it('누른 좌표로 동을 찾아 고르고, 동 밖을 누르면 고르지 않는다', () => {
    const { layer, dataLayers, fire, at, onSelect } = setup();
    layer.sync(three(), null);
    fire(dataLayers[0], 'click', at(37.6002, 127.0002));
    expect(onSelect).toHaveBeenCalledWith('b', { latitude: 37.6002, longitude: 127.0002 });
    onSelect.mockClear();
    fire(dataLayers[0], 'click', at(38, 128));
    fire(dataLayers[0], 'click', {});
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('마우스를 올린 동만 위에 진하게 그리고, 끄는 중이거나 지도를 벗어나면 지운다', () => {
    const { layer, map, dataLayers, fire, at, flush } = setup();
    layer.sync(three(), 'a');
    const [data] = dataLayers;
    fire(map, 'mousemove', at(37.7002, 127.0002));
    fire(map, 'mousemove', at(37.7002, 127.0003));
    flush();
    const hovered = focus(data, 'c')!;
    expect(0.28 + (hovered.properties.style.fillOpacity as number) * (1 - 0.28)).toBeCloseTo(0.38);
    expect(focus(data, 'a')).toBeDefined();
    // 고른 동 위에 올리면 고른 투명도보다 한 단계 더 진하다.
    fire(map, 'mousemove', at(37.5002, 127.0002));
    flush();
    expect(focus(data, 'c')).toBeUndefined();
    expect(0.28 + (focus(data, 'a')!.properties.style.fillOpacity as number) * (1 - 0.28)).toBeCloseTo(0.48);
    fire(map, 'mouseout');
    flush();
    expect(0.28 + (focus(data, 'a')!.properties.style.fillOpacity as number) * (1 - 0.28)).toBeCloseTo(0.38);
    fire(map, 'dragstart');
    fire(map, 'mousemove', at(37.7002, 127.0002));
    flush();
    expect(focus(data, 'c')).toBeUndefined();
    fire(map, 'dragend');
    fire(map, 'mousemove', at(37.7002, 127.0002));
    flush();
    expect(focus(data, 'c')).toBeDefined();
  });

  it('색이 바뀌면 바뀐 묶음만 다시 넣고, 고른 동도 그 위로 다시 넣는다', () => {
    const { layer, dataLayers } = setup();
    const regions = three();
    layer.sync(regions, 'c');
    const [data] = dataLayers;
    const nearKey = ids(data)[0];
    // 월세 필터로 b가 far 색으로 바뀌었다. near 묶음은 a만 남아 좌표가 바뀐다.
    layer.sync([regions[0], { ...regions[1], appearance: far }, regions[2]], 'c');
    const [groupsAdded, focusAdded] = data.addGeoJson.mock.calls.slice(-2).map(([json]) => json.features);
    expect(groupsAdded.map((feature) => feature.id)).toEqual([nearKey, expect.any(String)]);
    expect(focusAdded.map((feature) => feature.id)).toEqual(['focus:c']);
    expect(focus(data, 'c')).toBeDefined();
    expect(ids(data)).toHaveLength(3);
    // 묶음이 그대로면 아무것도 다시 넣지 않는다.
    const calls = data.addGeoJson.mock.calls.length;
    layer.sync([regions[0], { ...regions[1], appearance: far }, regions[2]], 'c');
    expect(data.addGeoJson).toHaveBeenCalledTimes(calls);
    // 결과가 사라지면 묶음도 지운다.
    layer.sync([], null);
    expect(ids(data)).toHaveLength(0);
  });

  it('확대 단계의 상세 좌표가 바뀌면 다시 넣는다', () => {
    const { layer, dataLayers, setLevel } = setup();
    const detailed = plain('a', {
      polygons: [[ring(37.5)]],
      simplifiedPolygons: { overview: [[ring(37.8)]], medium: [[ring(37.9)]] },
    });
    layer.sync([detailed], null);
    setLevel(9);
    layer.sync([detailed], null);
    const [feature] = dataLayers[0].features.values();
    expect(feature.geometry.coordinates[0][0][0]).toEqual([127, 37.8]);
    expect(dataLayers[0].addGeoJson).toHaveBeenCalledTimes(2);
  });

  it('GL 지도가 준비되기 전에는 Data 레이어를 만들지 않고, 결과가 없으면 만들지 않는다', () => {
    let ready = false;
    const { layer, dataLayers, flush } = setup({ ready: () => ready });
    layer.sync([], null);
    layer.sync(three(), null);
    flush();
    expect(dataLayers).toHaveLength(0);
    ready = true;
    flush();
    expect(dataLayers).toHaveLength(1);
    expect(dataLayers[0].setMap).toHaveBeenCalledWith({});
  });

  it('종료하면 Data 레이어와 이벤트를 정리하고, SDK가 사라졌으면 SDK를 부르지 않는다', () => {
    const first = setup();
    first.layer.sync(three(), null);
    first.fire(first.map, 'mousemove', first.at(37.5002, 127.0002));
    first.layer.dispose();
    expect(first.dataLayers[0].setMap).toHaveBeenLastCalledWith(null);
    expect(first.engine.removeListener).toHaveBeenCalledTimes(5);
    expect(first.cancel).toHaveBeenCalled();
    vi.restoreAllMocks();
    const second = setup();
    second.layer.sync(three(), null);
    second.layer.dispose(true);
    expect(second.dataLayers[0].setMap).not.toHaveBeenCalledWith(null);
    expect(second.engine.removeListener).not.toHaveBeenCalled();
  });
});
