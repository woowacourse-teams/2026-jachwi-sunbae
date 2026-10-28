import { formatManwon } from '@/features/map/api/commuteApi';
import ExplorationRecordAction from '@/features/onboarding/ui/exploration-record-action/ExplorationRecordAction';

import type { NeighborhoodPreviewContext } from '../../hooks/useNeighborhoodPreview';
import ListingLink from '../listing-link/ListingLink';
import RouteGuide from '../route-guide/RouteGuide';

import * as styles from './RouteDetailBody.styles';

type Props = {
  preview: NeighborhoodPreviewContext;
  area: NonNullable<NeighborhoodPreviewContext['selected']>;
};

/** 대중교통 상세 본문(월세 시세·경로·안내·매물 열기). 데스크탑·휴대폰 상세가 함께 쓴다. */
const RouteDetailBody = ({ preview, area }: Props) => (
  <>
    <section className={styles.rent} aria-label="월세 시세">
      <span>월세 시세</span>
      {area.rent ? (
        <>
          <strong>
            월세 {formatManwon(area.rent.monthlyRentKrw)} · 보증금 {formatManwon(area.rent.depositKrw)}
          </strong>
          <small>
            {area.rent.legalDongNames.join('·')} 거래 {area.rent.transactionCount}건 중앙값
          </small>
          {preview.rentPeriod && (
            <small>
              {preview.rentPeriod.startDate} ~ {preview.rentPeriod.endDate} 계약
            </small>
          )}
        </>
      ) : (
        <strong>거래가 적어 시세를 내지 않았어요</strong>
      )}
    </section>
    <RouteGuide
      route={preview.route}
      isLoading={preview.isRouteLoading}
      error={preview.routeError}
      onRetry={preview.retryRoute}
    />
    <p className={styles.notice}>
      시간표 기반 예상 정보예요. 실시간 버스 도착 정보는 제공하지 않아요. 집에서 출발 정류장까지 도보는 별도입니다.
    </p>
    <div className={styles.actions}>
      <ListingLink areaName={area.name} center={area.center} onOpen={preview.openListing} />
      {preview.isPublicExplore && (
        <ExplorationRecordAction
          location={{ ...area.center, address: area.fullName, roadAddress: null, jibunAddress: area.fullName }}
        />
      )}
    </div>
  </>
);

export default RouteDetailBody;
