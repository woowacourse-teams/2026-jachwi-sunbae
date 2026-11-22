import { render } from '@testing-library/react';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { mapCategoryMarkerSrc, propertyMarkerSrc, stationVariant } from '@/features/map/lib/mapIconAssets';
import type { MapMarker } from '@/features/map/model/Map';
import MapMarkerView, { createMapMarkerElement } from '@/features/map/ui/map-marker/MapMarkerView';

import { markerFixtures } from './mapMarkerFixtures';

describe('매물 마커의 지도 SDK 요소 변환', () => {
  it.each(['property', 'propertyCluster'] as const)('%s 마커는 집 핀 이미지를 넣은 마커 버튼을 반환한다', (tone) => {
    const marker: MapMarker = {
      id: 'property-10',
      latitude: 37.48,
      longitude: 126.93,
      label: '신림역 원룸',
      tone,
      count: tone === 'propertyCluster' ? 2 : undefined,
      actionable: true,
    };
    const onSelect = vi.fn();
    const element = createMapMarkerElement(marker, marker.id, onSelect);
    expect(element.tagName).toBe('BUTTON');
    expect(element.querySelector('img')?.getAttribute('src')).toBe(propertyMarkerSrc);
    expect(element.textContent).not.toContain('신림역 원룸');
    element.click();
    expect(onSelect).toHaveBeenCalledWith(marker);
  });
});

describe('시설 마커', () => {
  it('카테고리 핀 이미지를 넣고 군집이면 숫자 배지를 붙인다', () => {
    const element = createMapMarkerElement(
      {
        id: 'stop-1',
        latitude: 37.48,
        longitude: 126.93,
        label: '신림역 정류장',
        tone: 'cluster',
        category: 'TRANSPORT',
        count: 3,
      },
      null,
    );
    expect(element.querySelector('img')?.getAttribute('src')).toBe(mapCategoryMarkerSrc('TRANSPORT'));
    expect(element.textContent).toBe('3');
  });

  it('거리 메모는 싫어요를 다른 핀으로 그린다', () => {
    const element = createMapMarkerElement(
      {
        id: 'memo-1',
        latitude: 37.48,
        longitude: 126.93,
        label: '어두운 골목',
        tone: 'place',
        category: 'MEMO',
        variant: 'negative',
      },
      null,
    );
    expect(element.querySelector('img')?.getAttribute('src')).toBe(mapCategoryMarkerSrc('MEMO', 'negative'));
    expect(mapCategoryMarkerSrc('MEMO', 'negative')).not.toBe(mapCategoryMarkerSrc('MEMO', 'positive'));
  });
});

describe('통근 정류장 마커', () => {
  it('철도역(RS_) 정류장은 지하철역 핀으로, 나머지는 버스 정류장 핀으로 그린다', () => {
    const pinOf = (stopId: string) =>
      createMapMarkerElement(
        {
          id: stopId,
          latitude: 37.48,
          longitude: 126.93,
          label: '정류장',
          tone: 'place',
          category: 'TRANSPORT',
          variant: stationVariant(stopId),
        },
        null,
      )
        .querySelector('img')
        ?.getAttribute('src');
    expect(pinOf('RS_1002')).toBe(mapCategoryMarkerSrc('TRANSPORT', 'subway'));
    expect(pinOf('BS_TAGO_SEB1001')).toBe(mapCategoryMarkerSrc('TRANSPORT'));
    expect(mapCategoryMarkerSrc('TRANSPORT', 'subway')).not.toBe(mapCategoryMarkerSrc('TRANSPORT'));
  });
});

describe('고른 장소 말풍선 핀', () => {
  it('로고 대신 장소 이름을 말풍선에 담고 꼬리를 붙인다', () => {
    const element = createMapMarkerElement(
      { id: 'destination', latitude: 37.395, longitude: 127.111, label: '판교역로 166', tone: 'destination' },
      null,
    );
    expect(element.getAttribute('data-tone')).toBe('destination');
    expect(element.querySelector('img')).toBeNull();
    expect(element.textContent).toBe('판교역로 166');
    expect(element.children).toHaveLength(2);
  });
});

describe('겹친 거리 메모 묶음 마커', () => {
  it('좋아요와 싫어요 칸에 따봉과 개수를 함께 적고, 없는 쪽 칸은 그리지 않는다', () => {
    const marker = (positive: number, negative: number): MapMarker => ({
      id: 'street-memo:1,2,3',
      latitude: 37.48,
      longitude: 126.93,
      label: `거리 메모 ${positive + negative}개`,
      tone: 'destination',
      category: 'MEMO',
      tally: { positive, negative },
      actionable: true,
    });
    const both = createMapMarkerElement(marker(2, 1), null, vi.fn());
    expect([...both.querySelectorAll('[data-variant]')].map((cell) => cell.textContent)).toEqual(['👍 2', '👎 1']);
    const likesOnly = createMapMarkerElement(marker(3, 0), null, vi.fn());
    expect([...likesOnly.querySelectorAll('[data-variant]')].map((cell) => cell.textContent)).toEqual(['👍 3']);
  });
});

describe('주변 시설 점 마커', () => {
  it('아이콘 없이 marker.color로 칠한 작은 점으로 그린다', () => {
    const element = createMapMarkerElement(
      { id: 'dot-1', latitude: 37.48, longitude: 126.93, label: '편의점', tone: 'dot', color: '#ff8800' },
      null,
      vi.fn(),
    );
    expect(element.querySelector('img')).toBeNull();
    expect(element.style.background).toBe('rgb(255, 136, 0)');
  });
});

describe('지도 SDK 마커와 데모 지도 마커', () => {
  it.each(markerFixtures)('$name: 같은 템플릿에서 같은 DOM을 만든다', ({ marker, selectedMarkerId }) => {
    const { container } = render(
      <MapMarkerView marker={marker} selectedMarkerId={selectedMarkerId ?? null} onSelectMarker={vi.fn()} />,
    );
    const element = createMapMarkerElement(marker, selectedMarkerId ?? null, vi.fn());
    expect(container.children).toHaveLength(1);
    expect(element.isEqualNode(container.firstElementChild)).toBe(true);
  });

  it('글자는 마크업으로 해석하지 않고 그대로 넣는다', () => {
    const element = createMapMarkerElement(
      { id: 'shop', latitude: 37.48, longitude: 126.93, label: '<img src=x onerror=alert(1)>', tone: 'destination' },
      null,
    );
    expect(element.querySelector('img')).toBeNull();
    expect(element.textContent).toBe('<img src=x onerror=alert(1)>');
  });
});

describe('검색 핀 동작 카드', () => {
  it('출퇴근 장소로 설정과 지우기 버튼을 카드 안에 두고 누르면 각각 알린다', () => {
    const marker: MapMarker = {
      id: 'search',
      latitude: 37.48,
      longitude: 126.93,
      label: '강남역',
      tone: 'pinLabel',
      pinKind: 'search',
      removable: true,
      setsCommute: true,
      actionable: true,
    };
    const onSelect = vi.fn();
    const element = createMapMarkerElement(marker, null, onSelect);
    const actions = element.querySelector('[role="group"]');
    expect([...(actions?.querySelectorAll('button') ?? [])].map((button) => button.textContent)).toEqual([
      '출퇴근 장소로 설정',
      '지우기',
    ]);
    element.querySelector<HTMLElement>('[data-action="set-commute"]')?.click();
    expect(onSelect).toHaveBeenLastCalledWith({ ...marker, id: 'search:set-commute' });
    element.querySelector<HTMLElement>('[data-action="clear"]')?.click();
    expect(onSelect).toHaveBeenLastCalledWith(marker);
  });
});

describe('서버 렌더러', () => {
  // 지도 마커는 서버 렌더러 없이 만든다. 제품 코드가 다시 가져오면 webpack 별칭(비공개 파일 경로) 없이는
  // 스트리밍 렌더러까지 지도 화면 청크에 실린다(gzip 약 55KB).
  it('제품 코드는 react-dom/server를 가져오지 않는다', () => {
    const sourceRoot = resolve(__dirname, '../../../../../src');
    const sources = readdirSync(sourceRoot, { recursive: true, encoding: 'utf8' }).filter((file) =>
      /\.(ts|tsx)$/.test(file),
    );
    const importers = sources.filter((file) =>
      /from ['"]react-dom\/server/.test(readFileSync(join(sourceRoot, file), 'utf8')),
    );
    expect(sources.length).toBeGreaterThan(100);
    expect(importers).toEqual([]);
  });

  it('webpack 설정은 react-dom 안쪽 파일을 별칭으로 가리키지 않는다', () => {
    const config = readFileSync(resolve(__dirname, '../../../../../webpack/webpack.config.cjs'), 'utf8');
    expect(config).not.toMatch(/react-dom\/server|react-dom-server/);
  });
});
