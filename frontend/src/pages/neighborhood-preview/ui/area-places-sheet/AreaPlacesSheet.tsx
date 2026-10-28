import { css } from '@emotion/css';

import { formatManwon } from '@/features/map/api/commuteApi';
import { mapCategoryIconSrc, stationIconSrc } from '@/features/map/lib/mapIconAssets';
import type { NearbyAgency } from '@/features/map/model/Map';
import BottomSheet from '@/shared/ui/bottom-sheet/BottomSheet';

import { type NeighborhoodPlace, placeTitle } from '../../hooks/useNeighborhoodPlaces';
import type { NeighborhoodPreviewContext } from '../../hooks/useNeighborhoodPreview';
import { overRentNotice } from '../../model/criteriaLabels';
import ListingLink from '../listing-link/ListingLink';
import PlaceDetails from '../place-panel/PlaceDetails';

type Area = NonNullable<NeighborhoodPreviewContext['selected']>;
export type AreaPlacesTab = 'stations' | 'agencies';

type Props = {
  area: Area;
  /** 지금 화면 범위의 공인중개사. 공인중개사는 동네 단위로 받을 수 없어 화면 기준으로 보여 준다. */
  agencies: NearbyAgency[];
  /** 고른 정류장·공인중개사. 있으면 같은 시트 안에서 그 정보로 넘어가고, 뒤로가기로 목록에 돌아온다. */
  place: NeighborhoodPlace | null;
  preview: Pick<
    NeighborhoodPreviewContext,
    'destination' | 'maxMinutes' | 'maxTransfers' | 'rentPeriod' | 'openListing' | 'maxRent'
  >;
  /** 지금 탭. 지도도 탭에 맞춰 정류장만, 또는 공인중개사만 올리므로 화면이 들고 있다. */
  tab: AreaPlacesTab;
  onTabChange: (tab: AreaPlacesTab) => void;
  onSelectStation: (station: Area['stations'][number]) => void;
  onSelectAgency: (agency: NearbyAgency) => void;
  onBack: () => void;
  /** 끌어 내려 닫으면 동네 선택을 푼다. */
  onClose: () => void;
  /** 값이 바뀌면 시트를 제목만 보이게 내린다(지도 빈 곳을 찍었을 때). */
  peekSignal: number;
};

/**
 * 휴대폰에서 동네를 고르면 아래에 올리는 시트. `정류장`·`공인중개사` 탭으로 그 동네의 출발 정류장과
 * 지금 화면 안의 공인중개사를 고르게 하고, 고르면 시트를 바꾸지 않고 그 안에서 정보로 넘어간다.
 * 닫기 버튼은 두지 않는다. 끌어 내려 닫고, 끝까지 끌어 올리면 헤더에 뒤로가기·닫기가 있는 페이지로 본다.
 */
const AreaPlacesSheet = ({
  area,
  agencies,
  place,
  preview,
  onSelectStation,
  onSelectAgency,
  onBack,
  onClose,
  peekSignal,
  tab,
  onTabChange: setTab,
}: Props) => {
  const overRent = overRentNotice(area.rent, preview.maxRent);
  return (
    <BottomSheet
      title={place ? `${placeTitle(place)} 정보` : area.name}
      // 목록에서는 동네 이름 아래 전체 주소를 적는다.
      subtitle={place ? undefined : area.fullName}
      initialHeightPercent={place && place.kind !== 'agency' ? 55 : 38}
      showCloseButton={false}
      closeLabel="동네 정보 닫기"
      fullPage
      peekSignal={peekSignal}
      onBack={place ? onBack : undefined}
      // 다방 링크는 목록일 때 제목 오른쪽 끝에 정사각형 아이콘으로 둔다.
      headerEnd={
        place ? undefined : (
          <ListingLink variant="icon" areaName={area.name} center={area.center} onOpen={preview.openListing} />
        )
      }
      onClose={onClose}
    >
      {place ? (
        <PlaceDetails place={place} preview={preview} phoneAction="call" />
      ) : (
        <div className={styles.body}>
          {/* 동네 대중교통 상세로 넘어가지 않으므로 시세도 이 시트에 둔다. 끝까지 올리면 페이지처럼 본다. */}
          <section className={styles.rent} aria-label="월세 시세">
            {area.rent ? (
              <>
                <strong>
                  월세 {formatManwon(area.rent.monthlyRentKrw)} · 보증금 {formatManwon(area.rent.depositKrw)}
                </strong>
                <small>
                  {area.rent.legalDongNames.join('·')} 거래 {area.rent.transactionCount}건 중앙값
                  {preview.rentPeriod && ` · ${preview.rentPeriod.startDate} ~ ${preview.rentPeriod.endDate} 계약`}
                </small>
              </>
            ) : (
              <strong>거래가 적어 시세를 내지 않았어요</strong>
            )}
            {overRent && <p className={styles.overRent}>{overRent}</p>}
          </section>
          <div className={styles.tabs} role="tablist" aria-label={`${area.name} 주변 장소`}>
            <button
              type="button"
              role="tab"
              id="area-places-stations"
              aria-selected={tab === 'stations'}
              aria-controls="area-places-panel"
              onClick={() => setTab('stations')}
            >
              정류장 {area.stations.length}
            </button>
            <button
              type="button"
              role="tab"
              id="area-places-agencies"
              aria-selected={tab === 'agencies'}
              aria-controls="area-places-panel"
              onClick={() => setTab('agencies')}
            >
              공인중개사 {agencies.length}
            </button>
          </div>
          <div
            id="area-places-panel"
            role="tabpanel"
            aria-labelledby={tab === 'stations' ? 'area-places-stations' : 'area-places-agencies'}
          >
            {tab === 'stations' ? (
              <ul className={styles.items}>
                {area.stations.map((station) => (
                  <li key={station.stopId}>
                    <button type="button" onClick={() => onSelectStation(station)}>
                      <img src={stationIconSrc(station.stopId)} alt="" draggable={false} decoding="async" />
                      <span>{station.stopName}</span>
                      <small>{station.travelMinutes}분</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : agencies.length ? (
              <ul className={styles.items}>
                {agencies.map((agency) => (
                  <li key={agency.providerPlaceId}>
                    <button type="button" onClick={() => onSelectAgency(agency)}>
                      <img src={mapCategoryIconSrc('AGENCY')} alt="" draggable={false} decoding="async" />
                      <span>{agency.name}</span>
                      <small>{agency.address}</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>지금 화면 안에는 공인중개사가 없어요. 지도를 옮겨 보세요.</p>
            )}
          </div>
        </div>
      )}
    </BottomSheet>
  );
};

const styles = {
  body: css`
    label: AreaPlacesSheet-body;
    display: grid;
    gap: 0.75rem;
  `,

  rent: css`
    label: AreaPlacesSheet-rent;
    display: grid;
    gap: 0.2rem;

    & strong {
      font-size: 0.95rem;
    }

    & small {
      color: var(--color-muted);
      font-size: 0.75rem;
    }
  `,

  overRent: css`
    label: AreaPlacesSheet-overRent;
    margin: 0.2rem 0 0;
    color: var(--color-danger, #d14d4d);
    font-size: 0.78rem;
    font-weight: 600;
  `,

  /* 네이버 지도 하단 시트처럼 두 칸짜리 분할 탭. */
  tabs: css`
    label: AreaPlacesSheet-tabs;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem;
    padding: 0.25rem;
    border-radius: 0.75rem;
    background: var(--color-surface-muted, #f2f3f5);

    & button {
      padding: 0.65rem 0.5rem;
      border: 0;
      border-radius: 0.6rem;
      background: transparent;
      color: var(--color-ink-soft);
      font: inherit;
      font-size: 0.9rem;
      font-weight: 650;
      cursor: pointer;
    }

    & button[aria-selected='true'] {
      background: white;
      box-shadow: 0 1px 4px rgb(0 0 0 / 12%);
      color: var(--color-ink);
    }
  `,

  items: css`
    label: AreaPlacesSheet-items;
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;

    & button {
      display: flex;
      width: 100%;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.8rem 0.25rem;
      border: 0;
      border-bottom: 1px solid var(--color-border);
      background: none;
      color: var(--color-ink);
      font: inherit;
      text-align: left;
      cursor: pointer;
    }

    & img {
      flex: none;
      width: 1.75rem;
      height: 1.75rem;
    }

    & span {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      font-size: 0.9rem;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    & small {
      flex: none;
      max-width: 50%;
      overflow: hidden;
      color: var(--color-muted);
      font-size: 0.75rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,

  empty: css`
    label: AreaPlacesSheet-empty;
    margin: 0.5rem 0;
    color: var(--color-ink-soft);
    font-size: 0.85rem;
  `,
};

export default AreaPlacesSheet;
