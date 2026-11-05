import { css } from '@emotion/css';

import { formatManwon } from '@/features/map/api/commuteApi';
import { stationIconSrc } from '@/features/map/lib/mapIconAssets';

import type { AreaTab } from '../../hooks/useNeighborhoodMapView';
import type { AreaStation } from '../../hooks/useNeighborhoodPlaces';
import type { NeighborhoodPreviewContext } from '../../hooks/useNeighborhoodPreview';
import { overRentNotice } from '../../model/criteriaLabels';
import AreaOverview from '../area-overview/AreaOverview';
import AreaTabs from '../area-tabs/AreaTabs';
import ListingLink from '../listing-link/ListingLink';

type Area = NonNullable<NeighborhoodPreviewContext['selected']>;

/** 동네 정류장을 목록·정보 칸이 함께 쓰는 출발 정류장 값으로 바꾼다. */
export const areaStation = (station: Area['stations'][number]): AreaStation => ({
  stopId: station.stopId,
  name: `${station.stopName}${station.direction ? ` (${station.direction})` : ''}`,
  latitude: station.latitude,
  longitude: station.longitude,
});
type Props = {
  area: Area;
  selectedStopId: string | null;
  onSelectStation: (station: AreaStation) => void;
  onOpenListing: () => void;
  /** 월세 상한(만원, 0은 전체). 넘는 동네(지도의 회색)를 고르면 조건보다 비싸다고 알린다. */
  maxRent?: number;
  /** 열어 둔 탭. `동네 정보`는 시세, 주변 분석, 내 매물 통근 시간을, `교통`은 출발 정류장 목록을 보여 준다. */
  tab: AreaTab;
  onTabChange: (tab: AreaTab) => void;
  preview: Parameters<typeof AreaOverview>[0]['preview'];
};

/**
 * 데스크탑 랭킹에서 동네를 고르면 목록 옆 칸에 여는 요약. 동네의 경로를 바로 그리지 않는다.
 * 처음에는 `동네 정보` 탭에 월세 시세, 주변 분석 카드, 내 매물 통근 시간을 보여 주고, 출발 정류장 목록은 `교통` 탭에 둔다.
 * 정류장을 고르면 같은 칸에서 그 정류장에서 출발하는 경로를 연다. 공인중개사는 지도에서 마커를 눌러 본다.
 */
const AreaSummary = ({
  area,
  selectedStopId,
  onSelectStation,
  onOpenListing,
  maxRent = 0,
  tab,
  onTabChange,
  preview,
}: Props) => (
  <section className={styles.summary} aria-label={`${area.name} 요약`}>
    <AreaTabs areaName={area.name} value={tab} onChange={onTabChange} />
    {tab === 'overview' ? (
      <>
        <p className={styles.rent}>
          {area.rent
            ? `월세 ${formatManwon(area.rent.monthlyRentKrw)} / 보증금 ${formatManwon(area.rent.depositKrw)}`
            : '거래가 적어 시세를 내지 않았어요'}
        </p>
        {overRentNotice(area.rent, maxRent) && <p className={styles.overRent}>{overRentNotice(area.rent, maxRent)}</p>}
        <AreaOverview area={area} preview={preview} />
        <ListingLink areaName={area.name} center={area.center} onOpen={onOpenListing} />
      </>
    ) : (
      <ul className={styles.stations} aria-label={`${area.name} 출발 정류장`}>
        {area.stations.map((station) => (
          <li key={station.stopId}>
            <button
              type="button"
              aria-pressed={selectedStopId === station.stopId}
              onClick={() => onSelectStation(areaStation(station))}
            >
              <img src={stationIconSrc(station.stopId)} alt="" draggable={false} decoding="async" />
              <span>
                {station.stopName}
                {station.direction ? ` (${station.direction})` : ''}
              </span>
              <small>{station.travelMinutes}분</small>
            </button>
          </li>
        ))}
      </ul>
    )}
  </section>
);

const styles = {
  summary: css`
    label: AreaSummary-summary;
    display: grid;
    gap: 1rem;
    margin: -0.2rem 0 0.4rem;

    & h3 {
      margin: 0 0 0.5rem;
      font-size: 0.8rem;
      color: var(--color-ink-soft);
    }
  `,

  rent: css`
    label: AreaSummary-rent;
    margin: 0;
    font-size: 0.9rem;
    font-weight: 700;
  `,

  /* 목록 옆 칸이 통째로 넘어가므로 정류장 목록은 높이를 묶지 않는다. */
  overRent: css`
    label: AreaSummary-overRent;
    margin: -0.5rem 0 0;
    color: var(--color-danger, #d14d4d);
    font-size: 0.8rem;
    font-weight: 600;
  `,

  stations: css`
    label: AreaSummary-stations;
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;

    /* 카드 상자 없이 휴대폰 시트처럼 아이콘, 이름, 시간(주소)을 한 줄에 두고 구분선으로만 나눈다. */
    & button {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.8rem 0.25rem;
      border: 0;
      border-bottom: 1px solid var(--color-border);
      background: none;
      color: var(--color-ink);
      font: inherit;
      text-align: left;
      cursor: pointer;
    }

    & button:hover,
    & button[aria-pressed='true'] {
      background: var(--color-surface-muted);
    }

    & img {
      flex: none;
      width: 1.75rem;
      height: 1.75rem;
    }

    & span {
      flex: 1;
      min-width: 0;
      font-size: 0.9rem;
      font-weight: 600;
      overflow: hidden;
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
};

export default AreaSummary;
