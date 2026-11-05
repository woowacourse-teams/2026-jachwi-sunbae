import { useMemo, useRef, useState } from 'react';

import { formatManwon } from '@/features/map/api/commuteApi';
import type { MapBounds, MapMarker } from '@/features/map/model/Map';
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

/** 고른 동네 시트(칸)의 탭. `동네 정보`는 시세, 주변 분석, 내 매물 통근 시간을, `교통`은 출발 정류장을 보여 준다. */
export type AreaTab = 'overview' | 'transport';
type MemoView = { bounds: MapBounds; level: number };

const useNeighborhoodMapView = (
  preview: NeighborhoodPreviewContext,
  { showAreaAction = true, onEmptyTap, deselectOnRegionTap = false }: MapViewOptions = {},
) => {
  const isResultMap = !preview.isAnalyzing && !preview.error && !preview.isSelectingOnMap;
  const places = useNeighborhoodPlaces(isResultMap);
  // 동네를 고르면 `동네 정보` 탭부터 연다. 다른 동네를 고르면 다시 `동네 정보` 탭으로 돌아간다.
  const selectedCode = preview.selected?.adminDongCode ?? null;
  const [areaTab, setAreaTab] = useState<{ code: string | null; tab: AreaTab }>({ code: null, tab: 'overview' });
  const currentTab: AreaTab = areaTab.code === selectedCode ? areaTab.tab : 'overview';
  // 출발 정류장과 버스 정류장 마커는 동네를 고르고 `교통` 탭을 연 동안에만 올리고, 그때는 정류장만 둔다.
  const showsTransport = selectedCode !== null && currentTab === 'transport';
  // 거리 메모는 남기지 않고 보기만 한다. 멀리 보면 행정동 묶음, 가까이 보면 메모 하나씩 보여 준다.
  // 지도는 멈출 때 확대 단계를 먼저, 화면 범위를 나중에 알린다. 둘을 함께 상태에 올려 한 번만 다시 그린다.
  const levelRef = useRef(preview.resultLevel);
  const [memoView, setMemoView] = useState<MemoView | null>(null);
  const memos = useStreetMemos(isResultMap ? (memoView?.bounds ?? null) : null).memos;
  const memoMarkers = useMemo(
    () => (isResultMap && memoView ? dongMemoMarkers(memos, memoView.level) : []),
    [isResultMap, memoView, memos],
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
      ...places.markers.filter((marker) => (marker.category === 'TRANSPORT') === showsTransport),
      { ...preview.destination, id: 'destination', label: DESTINATION_LABEL, tone: 'destination' as const },
    ],
    [rankMarkers, memoMarkers, preview.destination, places.markers, showsTransport],
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
    /** 고른 동네 시트(칸)의 탭. 동네를 바꾸면 `동네 정보`로 돌아간다. */
    areaTab: currentTab,
    changeAreaTab: (tab: AreaTab) => {
      if (tab === currentTab) return;
      preview.changeAreaTab(tab);
      // 탭을 바꾸면 열어 둔 정류장, 부동산 정보는 닫는다. 교통 탭을 떠나면 정류장 마커도 거둔다.
      closeLayers();
      setAreaTab({ code: selectedCode, tab });
    },
    /** 동네·조건을 바꾸거나 다시 고를 때 열어 둔 정류장·부동산 정보를 모두 닫는다. */
    closeLayers,
  };
};

export default useNeighborhoodMapView;
