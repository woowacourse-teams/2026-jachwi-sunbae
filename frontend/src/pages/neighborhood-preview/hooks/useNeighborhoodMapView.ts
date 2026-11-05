import { useMemo, useRef, useState } from 'react';

import { formatManwon } from '@/features/map/api/commuteApi';
import { useNearbyFacilities } from '@/features/map/api/useNearbyFacilities';
import { placeMarkers } from '@/features/map/lib/mapClustering';
import { SEOUL_MAP_CENTER } from '@/features/map/lib/mapLocation';
import type { MapBounds, MapCategory, MapMarker, NearbyPlace } from '@/features/map/model/Map';
import type { MapCanvasProps, MapRegion } from '@/features/map/model/MapCanvas';
import { usePropertyCommuteTimes, usePropertyList } from '@/features/property/api/useProperties';
import type { PropertyCommuteTime } from '@/features/property/model/Property';
import { useStreetMemos } from '@/features/street-memo/api/useStreetMemos';
import {
  dongMemoMarkers,
  groupMemosByDong,
  STREET_MEMO_DONG_MARKER_PREFIX,
} from '@/features/street-memo/lib/streetMemoDongGroups';

import { propertyCommuteLabel } from '../model/propertyCommute';
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
  /**
   * 휴대폰처럼 순위를 접었다 펼 수 있는지. 켜면 순위는 결과에 처음 들어왔을 때만 펼쳐 두고, 레일 칸을 켜거나 지도를 끌면 접는다.
   * 끄면(데스크탑) 레일 칸을 켠 동안만 순위를 숨긴다.
   */
  rankCollapsible?: boolean;
};

/** 결과 지도 레일에서 고르는 주변 시설 분류. 메모는 따로 켜고 끈다. */
export type FacilityCategory = Exclude<MapCategory, 'MEMO'>;
/** 레일에서 고르는 칸. 시설 분류에 더해 `MY`(회원이 기록한 매물)가 있다. */
export type RailSelection = FacilityCategory | 'MY';
/** 레일 `My`를 켰을 때 시트(칸)와 지도에 보이는 매물 한 줄. */
export type MyPropertyRow = {
  propertyId: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
  commute: PropertyCommuteTime | null;
};
const MY_PROPERTY_PREFIX = 'my-property:';
/**
 * 레일에서 빼는 분류. 결과 지도 레일은 예전 본 방 기록 레일 모양으로 병원, 교통, 학교, 편의, 중개 다섯 칸이다.
 * 거리 메모는 버튼 없이 늘 보인다.
 */
export const RESULT_RAIL_HIDDEN_CATEGORIES: MapCategory[] = ['MEMO'];
/** 레일 시설을 세고 올리는 반경. 기준 동네 가운데에서 잰다. */
const RAIL_FACILITY_RADIUS = 2000;
const NO_CATEGORIES: MapCategory[] = [];
type MemoView = { bounds: MapBounds; level: number };

const useNeighborhoodMapView = (
  preview: NeighborhoodPreviewContext,
  { showAreaAction = true, onEmptyTap, deselectOnRegionTap = false, rankCollapsible = false }: MapViewOptions = {},
) => {
  const isResultMap = !preview.isAnalyzing && !preview.error && !preview.isSelectingOnMap;
  const places = useNeighborhoodPlaces(isResultMap);
  // 결과 지도 오른쪽에는 들어오자마자 예전 본 방 기록 레일 모양의 분류 레일을 둔다. 한 번에 한 분류만 켠다.
  // 레일은 동네를 고르기 전에는 1위 동네, 고르면 그 동네를 기준으로 가운데 2km 안 시설을 센다.
  const selectedCode = preview.selected?.adminDongCode ?? null;
  const railArea = preview.selected ?? preview.topAreas[0] ?? null;
  const [railSelection, setRailSelection] = useState<RailSelection | null>(null);
  const facilityCategory = railSelection === 'MY' ? null : railSelection;
  const showsMy = railSelection === 'MY';
  // `교통`을 켜면 동네를 고른 동안 출발 정류장 목록(시트, 칸)도 보여 준다.
  const showsTransport = facilityCategory === 'TRANSPORT';
  // `My`를 켜면 기록한 매물과 이번 출퇴근 장소까지 통근 시간을 받는다. 공개 동네 찾기는 로그인 전이라 부르지 않는다.
  const loadsMy = showsMy && isResultMap && !preview.isPublicExplore;
  const propertyList = usePropertyList(loadsMy);
  const commuteTimes = usePropertyCommuteTimes(loadsMy ? preview.destination : null);
  const myRows = useMemo<MyPropertyRow[]>(() => {
    const commutes = new Map(commuteTimes.data?.properties.map((item) => [item.propertyId, item]) ?? []);
    return (propertyList.data?.pages ?? [])
      .flatMap((page) => page.content)
      .map((property) => ({
        propertyId: property.propertyId,
        name: property.name,
        latitude: property.location.latitude,
        longitude: property.location.longitude,
        commute: commutes.get(property.propertyId) ?? null,
      }));
  }, [propertyList.data, commuteTimes.data]);
  const commuteMaxMinutes = commuteTimes.data?.maxMinutes ?? 60;
  const myMarkers = useMemo<MapMarker[]>(
    () =>
      showsMy
        ? myRows.flatMap((row) =>
            row.latitude === null || row.longitude === null
              ? []
              : [
                  {
                    id: `${MY_PROPERTY_PREFIX}${row.propertyId}`,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    label: row.name,
                    // 매물 핀 금액 자리에 이번 출퇴근 장소까지 통근 시간을 적는다.
                    summary: { amount: row.commute ? propertyCommuteLabel(row.commute, commuteMaxMinutes) : '…' },
                    tone: 'property' as const,
                  },
                ],
          )
        : [],
    [showsMy, myRows, commuteMaxMinutes],
  );
  // 거리 메모는 버튼 없이 늘 보기만 한다. 멀리 보면 행정동 묶음, 가까이 보면 메모 하나씩 보여 준다.
  // 지도는 멈출 때 확대 단계를 먼저, 화면 범위를 나중에 알린다. 둘을 함께 상태에 올려 한 번만 다시 그린다.
  const levelRef = useRef(preview.resultLevel);
  const [memoView, setMemoView] = useState<MemoView | null>(null);
  const memos = useStreetMemos(isResultMap ? (memoView?.bounds ?? null) : null).memos;
  const memoMarkers = useMemo(
    () => (isResultMap && memoView ? dongMemoMarkers(memos, memoView.level) : []),
    [isResultMap, memoView, memos],
  );
  // 레일로 켠 분류의 시설을 기준 동네 가운데 2km 안에서 받아 낱개 마커로 올리고, 누르면 정보를 연다.
  const nearby = useNearbyFacilities(
    railArea?.center ?? SEOUL_MAP_CENTER,
    RAIL_FACILITY_RADIUS,
    NO_CATEGORIES,
    isResultMap && railArea !== null,
    { loadAllCategories: true },
  );
  /** 레일 칸을 켜고 끈다. 같은 칸을 다시 누르면 끈다. 열어 둔 정류장, 부동산 정보는 닫는다. */
  const selectRail = (next: RailSelection) => {
    const value = railSelection === next ? null : next;
    preview.toggleMapCategory(next, value !== null);
    places.closePlace();
    setRailSelection(value);
    if (value !== null) setIsRankOpen(false);
  };
  // 순위(아래 카드 줄과 지도 위 순위 이름표)를 펼쳐 둘지. 결과에 새로 들어올 때마다 펼친다.
  const [isRankOpen, setIsRankOpen] = useState(true);
  const [wasResultMap, setWasResultMap] = useState(isResultMap);
  if (wasResultMap !== isResultMap) {
    setWasResultMap(isResultMap);
    if (isResultMap) setIsRankOpen(true);
  }
  const showsRank = railSelection === null && (!rankCollapsible || isRankOpen);
  const facilityMarkers = useMemo(
    () =>
      facilityCategory === null
        ? []
        : placeMarkers(nearby.data.places.filter((place) => place.category === facilityCategory)),
    [facilityCategory, nearby.data.places],
  );
  const facilityOf = (marker: MapMarker) =>
    marker.placeId === undefined
      ? null
      : (nearby.data.places.find((place) => place.providerPlaceId === marker.placeId) ?? null);
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
    const facility = facilityOf(marker);
    if (facility) {
      places.selectFacility(marker, facility);
      return;
    }
    places.selectMarker(marker);
  };
  // 상위 1~5위 동네는 동네 가운데에 순위 이름표를 띄운다. 순위를 접으면 함께 숨기고, 동네를 고르면 그 동네 이름표만 남긴다.
  // 가까이 확대하면 마커를 가리지 않게 거둔다.
  const rankMarkers = useMemo<MapMarker[]>(
    () =>
      places.isClose
        ? []
        : preview.topAreas.flatMap((area, index) =>
            (selectedCode !== null ? area.adminDongCode === selectedCode : showsRank)
              ? [
                  {
                    ...area.center,
                    id: `${RANK_MARKER_PREFIX}${area.adminDongCode}`,
                    label: `${area.name} ${index + 1}위`,
                    caption: area.name,
                    tone: 'rank' as const,
                    rank: index + 1,
                    actionable: true,
                  },
                ]
              : [],
          ),
    [preview.topAreas, places.isClose, selectedCode, showsRank],
  );
  const destinationMarkers = useMemo(
    () => [
      ...rankMarkers,
      ...memoMarkers,
      ...facilityMarkers,
      ...myMarkers,
      // 가까이 보면 올리는 화면 안 마커. 레일로 분류를 켰으면 그 분류 마커와 겹치지 않게 거두고(고른 출발 정류장은 남긴다),
      // 아무 분류도 켜지 않았으면 정류장을 뺀 부동산만 둔다.
      ...places.markers.filter((marker) =>
        railSelection === null ? marker.category !== 'TRANSPORT' : showsTransport && marker.id.startsWith('station:'),
      ),
      { ...preview.destination, id: 'destination', label: DESTINATION_LABEL, tone: 'destination' as const },
    ],
    [
      rankMarkers,
      memoMarkers,
      facilityMarkers,
      myMarkers,
      preview.destination,
      places.markers,
      showsTransport,
      facilityCategory,
    ],
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
        // 휴대폰은 손으로 지도를 끌면 순위를 접어 지도를 넓게 보이게 한다.
        onDragStart: rankCollapsible ? () => setIsRankOpen(false) : undefined,
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
    /** 결과 지도 오른쪽에 처음부터 두는 분류 레일(병원, 교통, 학교, 편의, 중개)의 값. */
    rail: {
      selectedCategories: (facilityCategory ? [facilityCategory] : []) as MapCategory[],
      counts: nearby.isSuccess ? nearby.data.counts : undefined,
      onToggle: (category: MapCategory) => {
        if (category === 'MEMO') return;
        selectRail(category);
      },
      /** 시설 분류 아래에 붙이는 `My` 칸. */
      extraItems: [
        {
          key: 'MY',
          label: 'My',
          ariaLabel: `내 매물 통근 시간 ${showsMy ? '숨기기' : '표시하기'}`,
          selected: showsMy,
          onToggle: () => selectRail('MY'),
        },
      ],
    },
    /** 순위(아래 카드 줄과 지도 위 순위 이름표)를 펼쳐 두었는지. */
    isRankOpen,
    /** 접어 둔 순위를 다시 펼친다(`순위 보기`). */
    openRank: () => setIsRankOpen(true),
    /** 레일에서 켠 칸. 없으면 null이고, 시트(칸)는 동네 순위와 시세를 보인다. */
    railSelection,
    /** 켠 레일 칸을 끈다(목록 시트를 끌어 내려 닫았을 때). */
    clearRail: () => {
      if (railSelection !== null) selectRail(railSelection);
    },
    /** 레일 기준 동네(고른 동네, 없으면 1위 동네). */
    railArea,
    /** 레일로 켠 시설 분류의 목록. 가까운 순이다. */
    railPlaces: useMemo(
      () =>
        facilityCategory === null
          ? []
          : nearby.data.places
              .filter((place) => place.category === facilityCategory)
              .sort((left, right) => left.distanceMeters - right.distanceMeters),
      [facilityCategory, nearby.data.places],
    ),
    railPlacesState: nearby.isError ? ('error' as const) : nearby.isSuccess ? ('ready' as const) : ('loading' as const),
    /** 목록에서 시설을 고르면 지도 마커를 누른 것처럼 그 정보를 연다. */
    selectRailPlace: (place: NearbyPlace) => places.selectFacility(placeMarkers([place])[0], place),
    /** `My`를 켰을 때의 매물과 통근 시간. */
    my: {
      rows: myRows,
      maxMinutes: commuteMaxMinutes,
      isLoading: loadsMy && (propertyList.isPending || commuteTimes.isPending),
      isError: propertyList.isError || commuteTimes.isError,
    },
    /** 레일에서 `교통`을 켜 출발 정류장 목록을 보여 줄지. */
    showsStations: showsTransport,
    /** 동네·조건을 바꾸거나 다시 고를 때 열어 둔 정류장·부동산 정보를 모두 닫는다. */
    closeLayers,
  };
};

export default useNeighborhoodMapView;
