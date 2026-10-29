import { css } from '@emotion/css';

import { BRANDS, CATEGORIES, PLATFORMS, PROMOTIONS } from '@/features/meal-deals/api/mealDealsApi';
import { formatKst, httpsUrl, won } from '@/features/meal-deals/lib/presentation';

import type { MealDetail } from '../hooks/useMealNavigation';
import MealSheet from './MealSheet';
import ProductImage from './ProductImage';

import * as shared from './MealContent.styles';

const MealDetails = ({ detail, onClose }: { detail: MealDetail; onClose: () => void }) => {
  if (detail.kind === 'product') {
    const { product, brand, sourceUrl } = detail;
    const source = httpsUrl(sourceUrl);
    return (
      <MealSheet title="상품 상세" onClose={onClose}>
        <div className={styles.image}>
          <ProductImage src={product.imageUrl} name={product.name} />
        </div>
        <p className={shared.description}>{BRANDS[brand]}</p>
        <h3>{product.name}</h3>
        <dl className={shared.facts}>
          <div>
            <dt>판매가격</dt>
            <dd>{won(product.price)}</dd>
          </div>
          <div>
            <dt>행사 유형</dt>
            <dd>{PROMOTIONS[product.promotionType]}</dd>
          </div>
          <div>
            <dt>상품 카테고리</dt>
            <dd>{CATEGORIES[product.category]}</dd>
          </div>
        </dl>
        <div className={shared.note}>
          <strong>행사 안내</strong>
          <p>
            브랜드가 제공한 행사 유형과 판매가격입니다. 할인 적용 조건은 공식 행사 페이지를 확인해 주세요. 매장별 행사
            적용과 재고는 다를 수 있어요.
          </p>
          {source && (
            <a href={source} target="_blank" rel="noreferrer">
              {BRANDS[brand]} 공식 행사 페이지 ↗
            </a>
          )}
        </div>
      </MealSheet>
    );
  }
  const { offer } = detail;
  return (
    <MealSheet title="할인 상세" onClose={onClose}>
      <span className={shared.badge}>{PLATFORMS[offer.platform]}</span>
      <h3>{offer.brandName}</h3>
      <strong className={styles.amount}>{won(offer.discountAmount)} 할인</strong>
      <dl className={shared.facts}>
        <div>
          <dt>최소 주문금액</dt>
          <dd>{offer.minOrderAmount === null ? '정보 없음' : won(offer.minOrderAmount)}</dd>
        </div>
        <div>
          <dt>행사 시작일</dt>
          <dd>{offer.startDate ?? '정보 없음'}</dd>
        </div>
        <div>
          <dt>행사 종료일</dt>
          <dd>{offer.endDate ?? '정보 없음'}</dd>
        </div>
        <div>
          <dt>적용 조건</dt>
          <dd>{offer.conditions?.trim() || '정보 없음'}</dd>
        </div>
        <div>
          <dt>마지막 확인</dt>
          <dd>{formatKst(offer.lastVerifiedAt)} (한국 시간)</dd>
        </div>
      </dl>
      <p className={shared.note}>
        배달비, 다른 할인과 주문 조건에 따라 최종 결제금액이 달라져요. 주문 전에 해당 앱에서 조건을 확인해 주세요.
      </p>
    </MealSheet>
  );
};
const styles = {
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
