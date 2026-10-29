import { css } from '@emotion/css';

import { formatKst, httpsUrl, won } from '@/features/meal-deals/lib/presentation';
import { BRANDS, CATEGORIES, PLATFORMS, PROMOTIONS } from '@/features/meal-deals/model/MealDeal';
import { LogClick, LogScreen } from '@/shared/lib/analytics/logging';
import InfoValue from '@/shared/ui/info-value/InfoValue';
import InlineNotice from '@/shared/ui/inline-notice/InlineNotice';

import type { MealLayout } from '../hooks/useMealTabs';
import { CHEAP_MEAL_EVENTS, detailViewedParams, outboundClickedParams } from '../lib/cheapMealAnalytics';
import type { MealDetail } from '../model/MealNavigation';
import MealSheet from './MealSheet';
import ProductImage from './ProductImage';

import * as shared from './MealContent.styles';

type MealDetailsProps = { detail: MealDetail; layout: MealLayout; onClose: () => void };

const MealDetails = ({ detail, layout, onClose }: MealDetailsProps) => {
  if (detail.kind === 'product') {
    const { product, brand, sourceUrl } = detail;
    const source = httpsUrl(sourceUrl);
    return (
      <MealSheet title="상품 상세" layout={layout} onClose={onClose}>
        <LogScreen event={CHEAP_MEAL_EVENTS.detailViewed} params={detailViewedParams('convenience', brand)}>
          <div className={styles.image}>
            <ProductImage src={product.imageUrl} name={product.name} />
          </div>
          <p className={shared.description}>{BRANDS[brand]}</p>
          <h3>{product.name}</h3>
          <dl className={styles.facts}>
            <InfoValue label="판매가격" value={won(product.price)} />
            <InfoValue label="행사 유형" value={PROMOTIONS[product.promotionType]} />
            <InfoValue label="상품 카테고리" value={CATEGORIES[product.category]} />
          </dl>
          <InlineNotice>
            브랜드가 제공한 행사 유형과 판매가격입니다. 할인 적용 조건은 공식 행사 페이지를 확인해 주세요. 매장별 행사
            적용과 재고는 다를 수 있어요.
          </InlineNotice>
          {source && (
            <LogClick
              event={CHEAP_MEAL_EVENTS.outboundClicked}
              params={outboundClickedParams('convenience', 'official_source', brand)}
            >
              <a className={shared.sourceLink} href={source} target="_blank" rel="noreferrer">
                {BRANDS[brand]} 공식 행사 페이지 ↗
              </a>
            </LogClick>
          )}
        </LogScreen>
      </MealSheet>
    );
  }
  const { offer } = detail;
  return (
    <MealSheet title="할인 상세" layout={layout} onClose={onClose}>
      <LogScreen event={CHEAP_MEAL_EVENTS.detailViewed} params={detailViewedParams('delivery', offer.platform)}>
        <span className={shared.badge}>{PLATFORMS[offer.platform]}</span>
        <h3>{offer.brandName}</h3>
        <strong className={styles.amount}>{won(offer.discountAmount)} 할인</strong>
        <dl className={styles.facts}>
          <InfoValue
            label="최소 주문금액"
            value={offer.minOrderAmount === null ? '' : won(offer.minOrderAmount)}
            emptyText="정보 없음"
          />
          <InfoValue label="행사 시작일" value={offer.startDate ?? ''} emptyText="정보 없음" />
          <InfoValue label="행사 종료일" value={offer.endDate ?? ''} emptyText="정보 없음" />
          <InfoValue label="적용 조건" value={offer.conditions?.trim() ?? ''} emptyText="정보 없음" />
          <InfoValue label="마지막 확인" value={`${formatKst(offer.lastVerifiedAt)} (한국 시간)`} />
        </dl>
        <InlineNotice>
          배달비, 다른 할인과 주문 조건에 따라 최종 결제금액이 달라져요. 주문 전에 해당 앱에서 조건을 확인해 주세요.
        </InlineNotice>
      </LogScreen>
    </MealSheet>
  );
};
const styles = {
  /* 적용 조건처럼 여러 줄인 값이 있어 공용 InfoValue의 가운데 정렬 대신 왼쪽 정렬로 읽힌다. */
  facts: css`
    label: MealDetails-facts;
    margin: 1rem 0;
    & dd {
      text-align: left;
      white-space: pre-wrap;
    }
  `,
  image: css`
    label: MealDetails-image;
    max-width: 13rem;
    margin: 0 auto 1.5rem;
  `,
  amount: css`
    label: MealDetails-amount;
    font-size: 1.8rem;
    letter-spacing: -0.04em;
  `,
};
export default MealDetails;
