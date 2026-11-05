import { useMemo, useRef, useState } from 'react';

import { formatManwon } from '@/features/map/api/commuteApi';
import { useNearbyFacilities } from '@/features/map/api/useNearbyFacilities';
import { placeMarkers } from '@/features/map/lib/mapClustering';
import { SEOUL_MAP_CENTER } from '@/features/map/lib/mapLocation';
import type { MapBounds, MapCategory, MapMarker } from '@/features/map/model/Map';
import type { MapCanvasProps, MapRegion } from '@/features/map/model/MapCanvas';
import { useStreetMemos } from '@/features/street-memo/api/useStreetMemos';
import {
  dongMemoMarkers,
  groupMemosByDong,
  STREET_MEMO_DONG_MARKER_PREFIX,
} from '@/features/street-memo/lib/streetMemoDongGroups';

import useNeighborhoodPlaces from './useNeighborhoodPlaces';
import type { NeighborhoodPreviewContext } from './useNeighborhoodPreview';

const NO_REGIONS: MapRegion[] = [];
/** 고른 출퇴근 장소 말풍선 핀의 글자. 장소 이름은 검색창·찾기 버튼에 있으니 핀은 고른 자리만 알린다. */
const DESTINATION_LABEL = '선택한 지역';
/** 상위 동네 순위 알약 마커 id의 머리. 뒤에 행정동 코드를 붙인다. */
const RANK_MARKER_PREFIX = 'area-rank:';

/**
 * 휴대폰·데스크탑 동네 찾기가 함께 쓰는 지도 설정. 위치 선택·분석·결과 내내 지도 하나를 유지하고 단계마다 넘기는 값만 바꾼다.
 * 단계마다 지도를 새로 만들면 GL 지도가 스타일·타일을 처음부터 다시 준비한다.
 */
type MapViewOptions = {
  /** 휴대폰은 고른 동네 위에 '대중교통 정보 보기' 말풍선을 띄운다. 데스크탑은 동네 정보를 왼쪽 목록에 펼치므로 띄우지 않는다. */
  showAreaAction?: boolean;
  /** 지도 빈 곳이나 고른 동네 안을 찍었을 때 열린 정보를 닫는 대신 할 일. 휴대폰은 시트를 내린다. */
  onEmptyTap?: () => void;
  /** 동네를 고른 채 지도의 동네(같은 동네든 다른 동네든)를 찍으면 동네 선택을 풀고 랭킹으로 돌아간다. 휴대폰은 시트를 닫는다. */
  deselectOnRegionTap?: boolean;
};

/** 결과 지도 레일에서 고르는 주변 시설 분류. 메모는 따로 켜고 끈다. */
export type FacilityCategory = Exclude<MapCategory, 'MEMO'>;
/** 레일에서 빼는 분류. 공인중개사는 가까이 확대하면 늘 보이므로 레일에 두지 않는다. */
export const RESULT_RAIL_HIDDEN_CATEGORIES: MapCategory[] = ['AGENCY'];
/** 고른 동네의 주변 시설을 세는 반경. 동네 주변 분석 지도의 첫 반경과 같다. */
const AREA_FACILITY_RADIUS = 2000;
const NO_CATEGORIES: MapCategory[] = [];
type MemoView = { bounds: MapBounds; level: number };

const useNeighborhoodMapView = (
  preview: NeighborhoodPreviewContext,
  { showAreaAction = true, onEmptyTap, deselectOnRegionTap = false }: MapViewOptions = {},
) => {
  const isResultMap = !preview.isAnalyzing && !preview.error && !preview.isSelectingOnMap;
  const places = useNeighborhoodPlaces(isResultMap);
  // 동네를 고르면 결과 지도 오른쪽에 본 방 기록 지도와 같은 분류 레일을 둔다. 한 번에 한 분류만 켜고,
  // 다른 동네를 고르면 분류를 끈 채로 다시 연다.
  const selectedCode = preview.selected?.adminDongCode ?? null;
  const [rail, setRail] = useState<{ code: string | null; category: FacilityCategory | null }>({
    code: null,
    category: null,
  });
  const facilityCategory = rail.code === selectedCode ? rail.category : null;
  // `교통`을 켜면 출발 정류장 목록(시트, 칸)과 정류장 마커를 보여 주고, 그때는 지도에 정류장만 둔다.
  const showsTransport = selectedCode !== null && facilityCategory === 'TRANSPORT';
  // 병원, 학교, 편의점은 고른 동네 가운데 기준 주변 시설로 바로 그린다. 레일의 개수도 이 조회로 센다.
  const nearby = useNearbyFacilities(
    preview.selected?.center ?? SEOUL_MAP_CENTER,
    AREA_FACILITY_RADIUS,
    NO_CATEGORIES,
    isResultMap && selectedCode !== null,
    { loadAllCategories: true },
  );
  const facilityMarkers = useMemo<MapMarker[]>(
    () =>
      facilityCategory && facilityCategory !== 'TRANSPORT'
        ? placeMarkers(nearby.data.places.filter((place) => place.category === facilityCategory)).map((marker) => ({
            ...marker,
            // 시설 정보 화면은 따로 두지 않는다. 이름은 마커 이름표로 본다.
            actionable: false,
          }))
        : [],
    [facilityCategory, nearby.data.places],
  );
  // 거리 메모는 남기지 않고 보기만 한다. 멀리 보면 행정동 묶음, 가까이 보면 메모 하나씩 보여 준다. 레일의 `메모`로 끄고 켠다.
  // 지도는 멈출 때 확대 단계를 먼저, 화면 범위를 나중에 알린다. 둘을 함께 상태에 올려 한 번만 다시 그린다.
  const [showsMemos, setShowsMemos] = useState(true);
  const levelRef = useRef(preview.resultLevel);
  const [memoView, setMemoView] = useState<MemoView | null>(null);
  const memos = useStreetMemos(isResultMap && showsMemos ? (memoView?.bounds ?? null) : null).memos;
  const memoMarkers = useMemo(
    () => (isResultMap && showsMemos && memoView ? dongMemoMarkers(memos, memoView.level) : []),
    [isResultMap, showsMemos, memoView, memos],
  );
  const hasOpenLayer = places.selectedPlace !== null;
  const closeLayers = () => places.closePlace();
  /** 지도 빈 곳·고른 동네 안을 찍었을 때. 화면별 동작(시트 내리기) 또는 열린 정보 닫기를 한다. */
  const tapEmpty = () => {
    if (onEmptyTap) onEmptyTap();
    else if (hasOpenLayer) closeLayers();
  };
  /** 지도의 동네(구역이나 순위 알약)를 찍었을 때. 이미 고른 동네 안을 다시 찍으면 열어 둔 정보만 닫고, 다른 동네를 찍으면 동네를 바꾼다. */
  const selectRegion = (id: string) => {
    if (deselectOnRegionTap && preview.selected) {
      closeLayers();
      preview.selectRegion(null);
      return;
    }
    if (id === preview.selected?.adminDongCode) {
      tapEmpty();
      return;
    }
    closeLayers();
    // 데스크탑은 동네를 고를 때 대중교통 상세를 열지 않는다(왼쪽 목록에 요약을 펼친다).
    preview.selectRegion(id, showAreaAction ? undefined : { openDetails: false });
  };
  const selectMarker = (marker: MapMarker) => {
    if (marker.id.startsWith(STREET_MEMO_DONG_MARKER_PREFIX)) {
      const code = marker.id.slice(STREET_MEMO_DONG_MARKER_PREFIX.length);
      const group = groupMemosByDong(memos).find((item) => item.adminDongCode === code);
      if (group) preview.focusMemoGroup(group, group.memos.length);
      return;
    }
    if (marker.id.startsWith(RANK_MARKER_PREFIX)) {
      selectRegion(marker.id.slice(RANK_MARKER_PREFIX.length));
      return;
    }
    places.selectMarker(marker);
  };
  // 상위 1~5위 동네는 동네 가운데에 순위 알약을 띄운다.
  // 가까이 확대했거나 동네를 골라 시트(칸)를 열면 마커와 시트를 가리지 않게 거둔다.
  const hasSelectedArea = selectedCode !== null;
  const rankMarkers = useMemo<MapMarker[]>(
    () =>
      places.isClose || hasSelectedArea
        ? []
        : preview.topAreas.map((area, index) => ({
            ...area.center,
            id: `${RANK_MARKER_PREFIX}${area.adminDongCode}`,
            label: `${area.name} ${index + 1}위`,
            caption: area.name,
            tone: 'rank' as const,
            rank: index + 1,
            actionable: true,
          })),
    [preview.topAreas, places.isClose, hasSelectedArea],
  );
  const destinationMarkers = useMemo(
    () => [
      ...rankMarkers,
      ...memoMarkers,
      ...facilityMarkers,
      // 가까이 보면 올리는 화면 안 마커. 교통을 켰으면 정류장만, 다른 분류를 켰으면 그 분류만 보이게 거두고,
      // 아무 분류도 켜지 않았으면 정류장을 뺀 부동산만 둔다.
      ...places.markers.filter((marker) =>
        showsTransport ? marker.category === 'TRANSPORT' : facilityCategory === null && marker.category !== 'TRANSPORT',
      ),
      { ...preview.destination, id: 'destination', label: DESTINATION_LABEL, tone: 'destination' as const },
    ],
    [rankMarkers, memoMarkers, facilityMarkers, preview.destination, places.markers, showsTransport, facilityCategory],
  );
  const candidateMarkers = useMemo(
    () => [
      ...(preview.hasChosenMapPoint
        ? [{ ...preview.mapCandidate, id: 'candidate', label: DESTINATION_LABEL, tone: 'destination' as const }]
        : []),
    ],
    [preview.mapCandidate, preview.hasChosenMapPoint],
  );
  const mapProps: Pick<MapCanvasProps, 'center'> & Partial<MapCanvasProps> = isResultMap
    ? {
        center: preview.center,
        level: preview.resultLevel,
        markers: destinationMarkers,
        onCenterChange: preview.rememberResultCenter,
        onLevelChange: (level: number) => {
          preview.rememberResultLevel(level);
          places.rememberLevel(level);
          levelRef.current = level;
        },
        onBoundsChange: (bounds: MapBounds) => {
          places.rememberBounds(bounds);
          const level = levelRef.current;
          setMemoView((current) =>
            current &&
            current.level === level &&
            current.bounds.south === bounds.south &&
            current.bounds.west === bounds.west &&
            current.bounds.north === bounds.north &&
            current.bounds.east === bounds.east
              ? current
              : { bounds, level },
          );
        },
        selectedMarkerId:
          places.selectedMarkerId ??
          (preview.selected ? `${RANK_MARKER_PREFIX}${preview.selected.adminDongCode}` : null),
        onSelectMarker: selectMarker,
        // 빈 곳을 찍으면 열어 둔 정류장·부동산 정보를 닫는다(휴대폰은 시트를 내린다).
        onSelectLocation: tapEmpty,
        regions: preview.regions,
        selectedRegionId: preview.selected?.adminDongCode,
        onSelectRegion: selectRegion,
        coordinateAction:
          // 정류장·부동산 정보를 띄우는 동안은 동네 말풍선을 숨겨 마커와 시트를 가리지 않게 한다.
          showAreaAction && preview.selected && !hasOpenLayer
            ? {
                ...preview.selected.center,
                placement: 'above' as const,
                label: `${preview.selected.name} · 약 ${preview.selected.commuteMinutes}분${preview.selected.rent ? ` · 월세 ${formatManwon(preview.selected.rent.monthlyRentKrw)}` : ''}\n대중교통 정보 보기 →`,
                onClick: preview.openAreaDetails,
              }
            : undefined,
      }
    : {
        center: preview.selectionCenter,
        level: preview.selectionLevel,
        // 확대·축소 버튼이 지금 보이는 자리에서 옮기도록 움직인 시점을 기억한다.
        onCenterChange: preview.rememberSelectionCenter,
        onLevelChange: preview.rememberSelectionLevel,
        markers: candidateMarkers,
        regions: NO_REGIONS,
        // 분석 중이거나 실패 화면이 지도를 덮고 있을 때는 위치 찍기를 끈다.
        // 찾기 버튼은 지도 위에 두면 고른 장소 말풍선 핀과 겹쳐, 휴대폰은 아래 카드·데스크탑은 왼쪽 칸에 둔다.
        onSelectLocation: preview.isSelectingOnMap ? preview.chooseMapPoint : undefined,
      };
  return {
    isResultMap,
    mapProps,
    places,
    /** 동네를 고른 동안 결과 지도 오른쪽에 두는 분류 레일의 값. */
    rail: {
      selectedCategories: [
        ...(showsMemos ? (['MEMO'] as const) : []),
        ...(facilityCategory ? [facilityCategory] : []),
      ] as MapCategory[],
      counts: nearby.isSuccess ? nearby.data.counts : undefined,
      onToggle: (category: MapCategory) => {
        if (category === 'MEMO') {
          preview.toggleMapCategory('MEMO', !showsMemos);
          setShowsMemos(!showsMemos);
          return;
        }
        const next = facilityCategory === category ? null : category;
        preview.toggleMapCategory(category, next !== null);
        // 분류를 바꾸면 열어 둔 정류장, 부동산 정보는 닫는다. 교통을 끄면 정류장 마커도 거둔다.
        closeLayers();
        setRail({ code: selectedCode, category: next });
      },
    },
    /** 레일에서 `교통`을 켜 출발 정류장 목록을 보여 줄지. */
    showsStations: showsTransport,
    /** 동네·조건을 바꾸거나 다시 고를 때 열어 둔 정류장·부동산 정보를 모두 닫는다. */
    closeLayers,
  };
};

export default useNeighborhoodMapView;
