import { css } from '@emotion/css';
import { useState } from 'react';
import { Outlet, useMatch } from 'react-router-dom';

import { SERVICE_MAP_STYLE_ID } from '@/features/map/lib/mapStyle';
import MapCanvas from '@/features/map/ui/map-canvas/MapCanvas';
import MapCategoryRail from '@/features/map/ui/map-category-rail/MapCategoryRail';
import ExplorationRecordAction from '@/features/onboarding/ui/exploration-record-action/ExplorationRecordAction';
import { LogClick } from '@/shared/lib/analytics/logging';
import { ROUTE_PATTERNS } from '@/shared/lib/navigation/appPaths';
import BottomSheet from '@/shared/ui/bottom-sheet/BottomSheet';
import { Button } from '@/shared/ui/button/Button';
import HorizontalRail from '@/shared/ui/horizontal-rail/HorizontalRail';
import Icon from '@/shared/ui/icon/Icon';
import RankedCard from '@/shared/ui/ranked-card/RankedCard';
import StateIllustration from '@/shared/ui/state-illustration/StateIllustration';

import useNeighborhoodMapView, { RESULT_RAIL_HIDDEN_CATEGORIES } from '../hooks/useNeighborhoodMapView';
import type { NeighborhoodPreviewContext } from '../hooks/useNeighborhoodPreview';
import useResultMapViewport from '../hooks/useResultMapViewport';
import { COMMUTE_COLORS, commuteLegend, OUT_OF_RENT_COLOR } from '../model/commuteColors';
import {
  areaCardDescription,
  criteriaSummary,
  emptyAreaMessage,
  rentLabel,
  transferLabel,
} from '../model/criteriaLabels';
import { mobileMapViewport } from '../model/resultMapView';
import type { NeighborhoodFilterField } from '../NeighborhoodFilters';
import { NeighborhoodFilterPicker } from '../NeighborhoodFilters';
import AnalysisOverlay from '../ui/analysis-overlay/AnalysisOverlay';
import AreaPlacesSheet from '../ui/area-places-sheet/AreaPlacesSheet';
import { areaStation } from '../ui/area-summary/AreaSummary';
import LocationControls from '../ui/location-controls/LocationControls';
import NeighborhoodMapSearch from '../ui/map-search/NeighborhoodMapSearch';
import MapTapHint from '../ui/map-tap-hint/MapTapHint';
import NeighborhoodPlaceSheet from '../ui/place-panel/NeighborhoodPlaceSheet';
import RailCategoryPanel, { railSelectionTitle } from '../ui/rail-category-panel/RailCategoryPanel';
import RentSlider from '../ui/rent-slider/RentSlider';

import * as shared from '../NeighborhoodPreviewPage.styles';
import { sheetSwap } from '../ui/rail-category-panel/railSwap.styles';

const CARD_RANKS = [1, 2, 3, 4, 5] as const;

type Props = {
  preview: NeighborhoodPreviewContext;
};

/**
 * 휴대폰 동네 찾기. 지도를 화면 전체에 두고 조건은 지도 아래 시트의 조건 칸으로, 결과는 지도 아래 가로 레일로 고른다.
 * 대중교통 상세는 지도 없이 화면 전체로 연다.
 */
const NeighborhoodPreviewMobilePage = ({ preview }: Props) => {
  // 위치를 고르는 동안 조건 칸 아래에 바로 펼친 피커. 같은 칸을 다시 누르면 접는다.
  const [pickerField, setPickerField] = useState<NeighborhoodFilterField | null>(null);
  const isRoutePage = useMatch(`${preview.mapPath}/${ROUTE_PATTERNS.area}/*`);
  const isDetailPage = useMatch(`${preview.mapPath}/${ROUTE_PATTERNS.areaDetails}`);
  const submitSearch = preview.startAnalysis;
  // 지도 빈 곳을 찍으면 시트를 닫지 않고 제목만 보이게 내린다.
  const [peekSignal, setPeekSignal] = useState(0);
  // 고른 동네의 정보는 지도 위 말풍선 대신 아래 시트(AreaPlacesSheet)에 둔다.
  const mapView = useNeighborhoodMapView(preview, {
    showAreaAction: false,
    onEmptyTap: () => setPeekSignal((value) => value + 1),
    // 시트가 열린 채 지도의 동네를 찍으면 시트를 닫고 랭킹을 다시 보여 준다.
    deselectOnRegionTap: true,
    rankCollapsible: true,
  });
  const { isResultMap, mapProps, places, closeLayers, rail, railSelection, railArea } = mapView;
  // 레일 칸을 켰을 때 시트에 보일 그 칸의 목록. 동네를 고르면 동네 시트 안에, 고르기 전에는 따로 띄운 시트에 둔다.
  const railPanel =
    railSelection !== null && railArea ? (
      <RailCategoryPanel
        selection={railSelection}
        areaName={railArea.name}
        places={mapView.railPlaces}
        placesState={mapView.railPlacesState}
        onSelectPlace={mapView.selectRailPlace}
        stations={preview.selected?.stations}
        onSelectStation={(station) => {
          places.selectStation(areaStation(station));
          preview.selectStation(station.stopId);
          preview.focusRoute(station);
        }}
        my={mapView.my}
        isPublicExplore={preview.isPublicExplore}
        destinationName={preview.destination.name}
        onOpenProperty={preview.openPropertyCommute}
      />
    ) : null;
  const railTitle = railSelection !== null && railArea ? railSelectionTitle(railSelection, railArea.name) : '';
  const recordArea = preview.selected ?? preview.topAreas[0];
  const hasAreaSheet = !!isRoutePage && !!preview.selected;
  // 지도는 화면 전체를 쓰고, 위 조건 줄과 동네를 고르면 올라올 아래 시트가 가리는 만큼 비우고 시점을 맞춘다.
  const mapSectionRef = useResultMapViewport<HTMLElement>(preview, (section) => {
    const rect = section.getBoundingClientRect();
    const header = section.querySelector('header');
    return mobileMapViewport(rect, header ? header.getBoundingClientRect().bottom - rect.top : 0);
  });
  // 결과에 들어오자마자 예전 본 방 기록 지도처럼 오른쪽 위에 확대 축소, 분류 레일, 현재 위치 버튼을 한 줄로 세운다.
  // 레일은 동네를 고르기 전에는 1위 동네, 고르면 그 동네 기준이다. 아래 시트는 그 밑에서 올라온다.
  // 동네를 고르기 전 결과 화면의 아래 묶음(내 매물 통근 시간, 순위 레일).
  // 아래 순위 카드 줄은 검색 결과에 처음 들어왔을 때만 펼쳐 둔다. 레일 칸을 켜거나 지도를 끌면 `순위 보기` 버튼으로 접고,
  // 지도 위 순위 이름표도 함께 숨긴다(`useNeighborhoodMapView`의 `rankCollapsible`).
  const { isRankOpen, openRank } = mapView;
  const showsRankArea =
    !isRoutePage && preview.topAreas.length > 0 && places.selectedPlace === null && railSelection === null;
  const showsResultStack = showsRankArea && isRankOpen;
  // 동네를 고르기 전에 레일 칸을 켜면 순위 레일 대신 그 칸의 목록 시트를 띄운다.
  const showsRailSheet = !hasAreaSheet && places.selectedPlace === null && railPanel !== null;
  const resultControls = (
    <LocationControls
      preview={preview}
      isResult
      zoom={{ level: preview.resultLevel, onZoom: preview.zoomResultBy }}
      className={styles.railControls}
      rail={<MapCategoryRail showMemo showIcons={false} hiddenCategories={RESULT_RAIL_HIDDEN_CATEGORIES} {...rail} />}
    />
  );
  // 통근, 환승, 월세 조건 칸. 위치를 고르기 전후 모두 아래 시트에 둔다.
  // 칸마다 위에 항목, 아래에 값을 적고, 읽을 때는 `통근 40분 이내`처럼 한 문장으로 읽게 한다.
  const filterCells: { field: NeighborhoodFilterField; title: string; value: string; label: string }[] = [
    {
      field: 'minutes',
      title: '통근',
      value: `${preview.maxMinutes}분 이내`,
      label: `통근 ${preview.maxMinutes}분 이내`,
    },
    {
      field: 'transfers',
      title: '환승',
      value: preview.maxTransfers === 0 ? '없음' : `${preview.maxTransfers}회 이하`,
      label: transferLabel(preview.maxTransfers),
    },
    {
      field: 'rent',
      title: '월세',
      value: preview.maxRent === 0 ? '전체' : `${preview.maxRent}만원 이하`,
      label: rentLabel(preview.maxRent),
    },
  ];
  const showsTapHint =
    !preview.hasChosenMapPoint && pickerField === null && !preview.query.trim() && preview.addressResults.length === 0;
  const filterChips = (
    <div className={shared.filterChips} aria-label="탐색 조건">
      {filterCells.map((cell) => (
        <LogClick key={cell.field} event="neighborhood_condition_clicked" params={{ field: cell.field }}>
          <button
            type="button"
            aria-label={cell.label}
            aria-expanded={pickerField === cell.field}
            onClick={() => setPickerField((open) => (open === cell.field ? null : cell.field))}
          >
            <span className={shared.filterCellTitle}>
              {cell.title}
              <Icon name="chevron-down" size={14} />
            </span>
            <span className={shared.filterCellValue}>{cell.value}</span>
          </button>
        </LogClick>
      ))}
    </div>
  );

  if (isDetailPage && !preview.isAnalyzing && !preview.error)
    return (
      <div className={shared.page}>
        <Outlet context={preview} />
      </div>
    );
  return (
    <main className={shared.page} data-public-explore={preview.isPublicExplore || undefined}>
      <section
        ref={mapSectionRef}
        className={shared.mapPage}
        aria-label={isResultMap ? '행정동 프리셋 지도' : '지도에서 목적지 선택'}
      >
        <MapCanvas
          animateView
          customStyleId={SERVICE_MAP_STYLE_ID}
          hideLoading={preview.isAnalyzing || Boolean(preview.error)}
          interactive
          onReady={preview.prefetchBoundaries}
          {...mapProps}
        />
        <AnalysisOverlay preview={preview} />
        {preview.isSelectingOnMap && (
          <>
            <header className={shared.searchHeader}>
              <NeighborhoodMapSearch preview={preview} />
              {!preview.hasChosenMapPoint && (
                <>
                  {preview.isSearching && (
                    <p className={shared.mapSearchResult} role="status">
                      주소를 찾고 있어요.
                    </p>
                  )}
                  {preview.searchError && (
                    <p className={shared.mapSearchResult} role="alert">
                      {preview.searchError}
                    </p>
                  )}
                  {preview.addressResults.map((address) => (
                    <button
                      className={shared.mapSearchResult}
                      key={`${address.latitude}-${address.longitude}`}
                      onClick={() => preview.selectAddress(address)}
                    >
                      {address.roadAddress ?? address.jibunAddress ?? address.address}
                    </button>
                  ))}
                </>
              )}
            </header>
            <LocationControls
              preview={preview}
              isResult={false}
              zoom={{ level: preview.selectionLevel, onZoom: preview.zoomSelectionBy }}
              isFilterOpen={pickerField !== null}
            />
            {showsTapHint && <MapTapHint />}
            {/* 조건 칸과 찾기 버튼은 위치를 고르기 전부터 아래 시트에 두어, 위치를 골라도 자리가 바뀌지 않게 한다.
                위치를 고르기 전에는 찾기 버튼을 막아 두고 장소를 고르라고 적는다. 지도 위 버튼은 말풍선 핀과 겹쳐 두지 않는다. */}
            <section
              className={shared.searchCard}
              aria-label={preview.hasChosenMapPoint ? '고른 출퇴근 장소' : '출퇴근 조건'}
            >
              <p className={shared.searchCardTitle}>이 조건으로 추천받아요</p>
              {filterChips}
              {pickerField !== null && (
                <NeighborhoodFilterPicker key={pickerField} preview={preview} field={pickerField} />
              )}
              {preview.hasChosenMapPoint ? (
                <Button fullWidth disabled={!preview.isValidCommuteTime} onClick={submitSearch}>
                  <span className={shared.searchCardLabel}>
                    <span>{preview.mapCandidate.name}</span>에서 찾기
                  </span>
                </Button>
              ) : (
                <Button fullWidth disabled>
                  지도에서 출퇴근 장소를 골라 주세요
                </Button>
              )}
            </section>
          </>
        )}
        {isResultMap && (
          <>
            <header className={`${shared.resultHeader} ${styles.resultHeader}`}>
              {/* 첫 줄: 들어온 곳(보통 홈)으로 나가는 집 버튼, 조건 요약 한 줄, 출퇴근 장소부터 다시 고르는 아이콘 버튼. */}
              <div className={styles.headerRow}>
                <button type="button" className={shared.mapBack} aria-label="동네 찾기 나가기" onClick={preview.leave}>
                  <Icon name="home" size={22} />
                </button>
                <p className={styles.criteriaSummary} aria-label="선택한 탐색 조건">
                  {criteriaSummary(preview)}
                </p>
                <button
                  type="button"
                  className={styles.resetButton}
                  aria-label="다시 선택하기"
                  onClick={() => {
                    closeLayers();
                    preview.reset();
                  }}
                >
                  <Icon name="refresh" size={22} />
                </button>
              </div>
              {/* 둘째 줄: 월세를 끌어서 바로 바꾸는 슬라이더와 지도 색 기준을 카드 하나에 둔다. 끄는 동안 지도 색과 순위가 바뀐다. */}
              <div className={styles.filterCard}>
                <RentSlider preview={preview} compact />
                <div className={shared.colorLegend} aria-label="통근 시간 색상 기준">
                  {commuteLegend(preview.maxMinutes).map(([group, label]) => (
                    <span key={group}>
                      <i style={{ background: COMMUTE_COLORS[group].fillColor }} />
                      {label}
                    </span>
                  ))}
                  {preview.maxRent > 0 && (
                    <span>
                      <i style={{ background: OUT_OF_RENT_COLOR.fillColor }} />
                      월세 조건 밖
                    </span>
                  )}
                </div>
              </div>
            </header>
            {resultControls}
            {preview.isPublicExplore && recordArea && (
              <div className={shared.recordAction}>
                <ExplorationRecordAction
                  location={{
                    ...recordArea.center,
                    address: recordArea.fullName,
                    roadAddress: null,
                    jibunAddress: recordArea.fullName,
                  }}
                />
              </div>
            )}
            {preview.matchedAreaCount === 0 && (
              <div className={shared.resultControls}>
                <div className={shared.selectedInfo} role="status">
                  <StateIllustration name="empty-search" size={4.5} />
                  <p>{emptyAreaMessage(preview.maxRent)}</p>
                </div>
              </div>
            )}
            {showsResultStack && (
              <div className={`${shared.topAreaRail} ${styles.resultStack}`}>
                <div aria-label="통근 시간 상위 동네" role="group">
                  <HorizontalRail className={shared.areaCards}>
                    {preview.topAreas.map((area, index) => (
                      <RankedCard
                        key={area.adminDongCode}
                        className={shared.areaCard}
                        rank={CARD_RANKS[index]}
                        title={area.name}
                        value={area.commuteMinutes}
                        unit="분"
                        description={areaCardDescription(area)}
                        selected={preview.selected?.adminDongCode === area.adminDongCode}
                        onSelect={() => preview.selectRegion(area.adminDongCode)}
                      />
                    ))}
                  </HorizontalRail>
                </div>
              </div>
            )}
            {showsRankArea && !isRankOpen && (
              <Button variant="secondary" className={styles.rankToggle} onClick={openRank}>
                <Icon name="chevron-up" size={18} />
                순위 보기
              </Button>
            )}
            {/* 동네를 고르면 동네 정보 시트를 올린다. 레일 칸을 켜면 시트가 그 목록으로 바뀌고, 교통에서 출발 정류장을 고르면 시트 안에서 경로로 넘어간다. */}
            {hasAreaSheet && preview.selected && (
              <AreaPlacesSheet
                // 레일 칸이 바뀌면 시트를 새로 그려 다시 올라오게 해, 내용이 바뀐 것을 보인다.
                key={`${preview.selected.adminDongCode}:${railSelection ?? 'none'}`}
                className={sheetSwap}
                rail={railPanel ? { title: railTitle, content: railPanel } : undefined}
                area={preview.selected}
                place={places.selectedPlace}
                preview={preview}
                peekSignal={peekSignal}
                onBack={places.closePlace}
                onClose={() => {
                  closeLayers();
                  preview.selectRegion(null);
                }}
              />
            )}
            {showsRailSheet && (
              <BottomSheet
                key={railSelection}
                title={railTitle}
                subtitle={railArea?.fullName}
                className={sheetSwap}
                initialHeightPercent={38}
                showCloseButton={false}
                closeLabel="목록 닫기"
                peekSignal={peekSignal}
                onClose={mapView.clearRail}
              >
                {railPanel}
              </BottomSheet>
            )}
            {/* 동네를 고르지 않고 마커로 연 장소는 따로 시트를 띄운다. */}
            {!hasAreaSheet && places.selectedPlace && (
              <NeighborhoodPlaceSheet
                place={places.selectedPlace}
                preview={preview}
                peekSignal={peekSignal}
                onClose={places.closePlace}
              />
            )}
            {isRoutePage && <Outlet context={preview} />}
          </>
        )}
      </section>
    </main>
  );
};

const styles = {
  /* 동네를 고르기 전 결과 화면의 아래 묶음. 위에서부터 내 매물 통근 시간, 순위 레일을 쌓는다. */
  resultStack: css`
    label: NeighborhoodPreviewMobilePage-resultStack;

    && {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-top: 0;
    }
  `,

  /* 결과 머리. 첫 줄(집, 조건 요약, 다시 선택)과 둘째 줄(월세 슬라이더와 색 기준 카드)을 위아래로 쌓는다. */
  resultHeader: css`
    label: NeighborhoodPreviewMobilePage-resultHeader;

    && {
      flex-direction: column;
      align-items: stretch;
      gap: 0.45rem;
    }
  `,

  headerRow: css`
    label: NeighborhoodPreviewMobilePage-headerRow;
    display: flex;
    align-items: center;
    gap: 0.45rem;
  `,

  /* 조건 요약 한 줄. 넘치면 말줄임으로 자른다. */
  criteriaSummary: css`
    label: NeighborhoodPreviewMobilePage-criteriaSummary;
    flex: 1;
    min-width: 0;
    margin: 0;
    padding: 0 0.9rem;
    overflow: hidden;
    border: 1px solid var(--color-border);
    border-radius: 99px;
    background: var(--color-surface);
    box-shadow: var(--shadow-floating);
    color: var(--color-ink);
    font-size: 0.82rem;
    font-weight: 700;
    line-height: 2.75rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,

  resetButton: css`
    label: NeighborhoodPreviewMobilePage-resetButton;
    flex: none;
    display: grid;
    place-items: center;
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    border: 1px solid var(--color-border);
    border-radius: 50%;
    background: var(--color-surface);
    box-shadow: var(--shadow-floating);
    color: var(--color-ink);
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }
  `,

  /* 월세 슬라이더와 색 기준을 묶은 카드. 지도 위에서도 읽히게 흰 바탕과 그림자를 둔다. */
  filterCard: css`
    label: NeighborhoodPreviewMobilePage-filterCard;
    display: grid;
    gap: 0.2rem;
    padding: 0.45rem 0.8rem 0.4rem;
    border: 1px solid var(--color-border);
    border-radius: 0.9rem;
    background: var(--color-surface);
    box-shadow: var(--shadow-floating);

    & > [aria-label='통근 시간 색상 기준'] {
      padding: 0;
      background: none;
    }
  `,

  /* 접어 둔 순위 줄을 다시 펼치는 작은 버튼. 지도 아래 왼쪽에 띄운다. */
  rankToggle: css`
    label: NeighborhoodPreviewMobilePage-rankToggle;

    && {
      position: absolute;
      left: 0.85rem;
      bottom: calc(var(--map-sheet-bottom, env(safe-area-inset-bottom)) + 1rem);
      z-index: 2;
      min-height: 2.5rem;
      padding: 0 0.9rem;
      border-radius: 99px;
      box-shadow: var(--shadow-floating);
      font-size: 0.8rem;
    }

    & > span {
      gap: 0.3rem;
    }
  `,

  /* 위쪽 결과 머리(조건 요약 줄, 월세와 색 기준 카드) 아래 오른쪽에 확대 축소, 분류 레일, 현재 위치 버튼을 세운다. */
  railControls: css`
    label: NeighborhoodPreviewMobilePage-railControls;

    && {
      top: calc(env(safe-area-inset-top) + 10rem);
    }
  `,
};

export default NeighborhoodPreviewMobilePage;
