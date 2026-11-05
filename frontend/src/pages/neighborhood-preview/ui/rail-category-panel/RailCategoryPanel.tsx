import { css } from '@emotion/css';
import { Link } from 'react-router-dom';

import { stationIconSrc } from '@/features/map/lib/mapIconAssets';
import { getMapCategoryLabel } from '@/features/map/lib/mapPresentation';
import type { NearbyPlace } from '@/features/map/model/Map';
import { propertyDetailPath } from '@/shared/lib/navigation/appPaths';

import type { MyPropertyRow, RailSelection } from '../../hooks/useNeighborhoodMapView';
import type { NeighborhoodPreviewContext } from '../../hooks/useNeighborhoodPreview';
import { distanceLabel, propertyCommuteLabel, propertyCommuteOrder } from '../../model/propertyCommute';

type Area = NonNullable<NeighborhoodPreviewContext['selected']>;

type Props = {
  selection: RailSelection;
  /** 레일 기준 동네(고른 동네, 없으면 1위 동네). */
  areaName: string;
  places: NearbyPlace[];
  placesState: 'loading' | 'ready' | 'error';
  onSelectPlace: (place: NearbyPlace) => void;
  /** 동네를 골랐으면 교통 칸에 그 동네 출발 정류장 목록을 둔다. */
  stations?: Area['stations'];
  selectedStopId?: string | null;
  onSelectStation?: (station: Area['stations'][number]) => void;
  my: { rows: MyPropertyRow[]; maxMinutes: number; isLoading: boolean; isError: boolean };
  isPublicExplore: boolean;
  destinationName: string;
  onOpenProperty: () => void;
};

/** 레일 칸의 이름. 시트 제목에 쓴다. */
export const railSelectionTitle = (selection: RailSelection, areaName: string) =>
  selection === 'MY'
    ? '내 매물 통근 시간'
    : `${areaName} 주변 ${selection === 'AGENCY' ? '중개사' : getMapCategoryLabel(selection)}`;

/**
 * 결과 지도 레일에서 켠 칸의 목록. 휴대폰 시트와 데스크탑 목록 칸이 함께 쓴다.
 * 시설은 이름과 거리(가까운 순), 교통은 동네를 골랐으면 출발 정류장, 아니면 주변 정류장, `My`는 매물과 이번 출퇴근 장소까지 통근 시간이다.
 */
const RailCategoryPanel = ({
  selection,
  areaName,
  places,
  placesState,
  onSelectPlace,
  stations,
  selectedStopId = null,
  onSelectStation,
  my,
  isPublicExplore,
  destinationName,
  onOpenProperty,
}: Props) => {
  const title = railSelectionTitle(selection, areaName);
  if (selection === 'MY') {
    const rows = [...my.rows].sort(
      (left, right) => propertyCommuteOrder(left.commute) - propertyCommuteOrder(right.commute),
    );
    return (
      <section className={styles.panel} aria-label={`${title} 목록`}>
        <p className={styles.lead}>내 매물에서 {destinationName}까지</p>
        {isPublicExplore ? (
          <p className={styles.notice}>
            로그인하고 본 방을 기록하면 매물마다 이번 출퇴근 장소까지 통근 시간을 볼 수 있어요.
          </p>
        ) : my.isLoading ? (
          <p className={styles.notice}>내 매물을 불러오고 있어요.</p>
        ) : my.isError ? (
          <p className={styles.notice}>내 매물을 불러오지 못했어요.</p>
        ) : rows.length === 0 ? (
          <p className={styles.notice}>
            아직 기록한 매물이 없어요. 본 방 기록에서 매물을 남기면 여기에서 통근 시간을 볼 수 있어요.
          </p>
        ) : (
          <ul className={styles.items}>
            {rows.map((row) => (
              <li key={row.propertyId}>
                <Link to={propertyDetailPath(row.propertyId)} onClick={onOpenProperty}>
                  <span>{row.name}</span>
                  <small data-status={row.commute?.status}>
                    {row.commute ? propertyCommuteLabel(row.commute, my.maxMinutes) : '…'}
                  </small>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }
  if (selection === 'TRANSPORT' && stations && onSelectStation)
    return (
      <section className={styles.panel} aria-label={`${title} 목록`}>
        <ul className={styles.items} aria-label={`${areaName} 출발 정류장`}>
          {stations.map((station) => (
            <li key={station.stopId}>
              <button
                type="button"
                aria-pressed={selectedStopId === station.stopId}
                onClick={() => onSelectStation(station)}
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
      </section>
    );
  return (
    <section className={styles.panel} aria-label={`${title} 목록`}>
      {placesState === 'loading' ? (
        <p className={styles.notice}>주변 시설을 불러오고 있어요.</p>
      ) : placesState === 'error' ? (
        <p className={styles.notice}>주변 시설을 불러오지 못했어요.</p>
      ) : places.length === 0 ? (
        <p className={styles.notice}>2km 안에 이 시설이 없어요.</p>
      ) : (
        <ul className={styles.items}>
          {places.map((place) => (
            <li key={place.providerPlaceId}>
              <button type="button" onClick={() => onSelectPlace(place)}>
                <span>{place.name}</span>
                <small>{distanceLabel(place.distanceMeters)}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const styles = {
  panel: css`
    label: RailCategoryPanel-panel;
    display: grid;
    gap: 0.4rem;
  `,

  lead: css`
    label: RailCategoryPanel-lead;
    margin: 0;
    color: var(--color-ink-soft);
    font-size: 0.8rem;
  `,

  notice: css`
    label: RailCategoryPanel-notice;
    margin: 0;
    padding: 0.6rem 0;
    color: var(--color-muted);
    font-size: 0.85rem;
  `,

  items: css`
    label: RailCategoryPanel-items;
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;

    & button,
    & a {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem 0.25rem;
      border: 0;
      border-bottom: 1px solid var(--color-border);
      background: none;
      color: var(--color-ink);
      font: inherit;
      text-align: left;
      text-decoration: none;
      cursor: pointer;
    }

    & button:hover,
    & a:hover,
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
      overflow: hidden;
      font-size: 0.9rem;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    & small {
      flex: none;
      color: var(--color-muted);
      font-size: 0.78rem;
    }

    & small[data-status='REACHABLE'] {
      color: var(--color-primary-dark);
      font-weight: 700;
    }
  `,
};

export default RailCategoryPanel;
