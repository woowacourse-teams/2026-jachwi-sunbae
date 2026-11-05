import { css } from '@emotion/css';

import { formatManwon } from '@/features/map/api/commuteApi';

import type { AreaStation } from '../../hooks/useNeighborhoodPlaces';
import type { NeighborhoodPreviewContext } from '../../hooks/useNeighborhoodPreview';
import { overRentNotice } from '../../model/criteriaLabels';
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
  onOpenListing: () => void;
  /** 월세 상한(만원, 0은 전체). 넘는 동네(지도의 회색)를 고르면 조건보다 비싸다고 알린다. */
  maxRent?: number;
};

/**
 * 데스크탑 랭킹에서 동네를 고르면 목록 옆 칸에 여는 요약. 동네의 경로를 바로 그리지 않고 월세 시세와 다방 링크를 둔다.
 * 출발 정류장과 주변 시설, 내 매물 통근 시간은 지도 레일 칸을 켜면 왼쪽 목록 칸에 보인다.
 */
const AreaSummary = ({ area, onOpenListing, maxRent = 0 }: Props) => (
  <section className={styles.summary} aria-label={`${area.name} 요약`}>
    <p className={styles.rent}>
      {area.rent
        ? `월세 ${formatManwon(area.rent.monthlyRentKrw)} / 보증금 ${formatManwon(area.rent.depositKrw)}`
        : '거래가 적어 시세를 내지 않았어요'}
    </p>
    {overRentNotice(area.rent, maxRent) && <p className={styles.overRent}>{overRentNotice(area.rent, maxRent)}</p>}
    <ListingLink areaName={area.name} center={area.center} onOpen={onOpenListing} />
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
};

export default AreaSummary;
