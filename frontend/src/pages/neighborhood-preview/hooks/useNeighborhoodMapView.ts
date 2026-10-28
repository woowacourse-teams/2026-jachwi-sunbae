import { useMemo } from 'react';

import { formatManwon } from '@/features/map/api/commuteApi';
import type { MapMarker } from '@/features/map/model/Map';
import type { MapCanvasProps, MapRegion } from '@/features/map/model/MapCanvas';
import useStreetMemoLayer from '@/features/street-memo/hooks/useStreetMemoLayer';

import useNeighborhoodPlaces from './useNeighborhoodPlaces';
import type { NeighborhoodPreviewContext } from './useNeighborhoodPreview';

const NO_REGIONS: MapRegion[] = [];
/** 고른 출퇴근 장소 말풍선 핀의 글자. 장소 이름은 검색창·찾기 버튼에 있으니 핀은 고른 자리만 알린다. */
const DESTINATION_LABEL = '선택한 지역';

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
  /** 휴대폰 동네 시트의 탭. 정류장 탭이면 정류장 마커만, 공인중개사 탭이면 공인중개사 마커만 올린다(메모는 숨긴다). */
  placeMarkers?: 'stations' | 'agencies';
};

const useNeighborhoodMapView = (
  preview: NeighborhoodPreviewContext,
  { showAreaAction = true, onEmptyTap, deselectOnRegionTap = false, placeMarkers }: MapViewOptions = {},
) => {
  const isResultMap = !preview.isAnalyzing && !preview.error && !preview.isSelectingOnMap;
  const places = useNeighborhoodPlaces(isResultMap);
  // 거리 메모는 정류장·부동산과 같이 가까이 확대했을 때만 화면 범위로 올린다.
  // 동네 찾기에서는 남긴 메모를 보기만 하고, 새 메모는 본 방 기록 지도에서 남긴다.
  const memo = useStreetMemoLayer(places.isClose, places.bounds);
  const hasOpenLayer = places.selectedPlace !== null || memo.mode !== null;
  const closeLayers = () => {
    places.closePlace();
    memo.close();
  };
  /** 지도 빈 곳·고른 동네 안을 찍었을 때. 메모는 닫고, 그 밖에는 화면별 동작(시트 내리기) 또는 열린 정보 닫기를 한다. */
  const tapEmpty = () => {
    if (memo.mode !== null) memo.close();
    else if (onEmptyTap) onEmptyTap();
    else if (hasOpenLayer) closeLayers();
  };
  const selectMarker = (marker: MapMarker) => {
    if (memo.selectMarker(marker)) {
      places.closePlace();
      return;
    }
    memo.close();
    places.selectMarker(marker);
  };
  const destinationMarkers = useMemo(
    () => [
      ...(placeMarkers
        ? places.markers.filter((marker) => marker.category === (placeMarkers === 'stations' ? 'TRANSPORT' : 'AGENCY'))
        : places.markers),
      ...(placeMarkers ? [] : memo.markers),
      { ...preview.destination, id: 'destination', label: DESTINATION_LABEL, tone: 'destination' as const },
    ],
    [preview.destination, places.markers, memo.markers, placeMarkers],
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
        },
        onBoundsChange: places.rememberBounds,
        selectedMarkerId: places.selectedMarkerId ?? memo.selectedMarkerId,
        onSelectMarker: selectMarker,
        // 빈 곳을 찍으면 열어 둔 정류장·부동산·메모 정보를 닫는다(휴대폰은 시트를 내린다).
        onSelectLocation: tapEmpty,
        regions: preview.regions,
        selectedRegionId: preview.selected?.adminDongCode,
        // 이미 고른 동네 안을 다시 찍으면 열어 둔 정보만 닫고, 다른 동네를 찍으면 동네를 바꾼다.
        onSelectRegion: (id: string) => {
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
        },
        coordinateAction:
          // 정류장·부동산·메모 정보를 띄우는 동안은 동네 말풍선을 숨겨 마커와 시트를 가리지 않게 한다.
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
    memo,
    /** 동네·조건을 바꾸거나 다시 고를 때 열어 둔 정류장·부동산·메모 정보를 모두 닫는다. */
    closeLayers,
  };
};

export default useNeighborhoodMapView;
