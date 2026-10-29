import { css } from '@emotion/css';
import { useState } from 'react';

import {
  type Brand,
  BRANDS,
  describeMealError,
  type Promotion,
  PROMOTIONS,
  usePromotions,
} from '@/features/meal-deals/api/mealDealsApi';
import { formatKst, httpsUrl, won } from '@/features/meal-deals/lib/presentation';
import { Button } from '@/shared/ui/button/Button';
import QueryState from '@/shared/ui/query-state/QueryState';
import { SegmentedControl, SegmentedControlItem } from '@/shared/ui/segmented-control/SegmentedControl';

import type { MealDetail } from '../hooks/useMealNavigation';
import ProductImage from './ProductImage';

import * as shared from './MealContent.styles';

type Filter = 'ALL' | 'OTHER' | Promotion;
const filters: { value: Filter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'ONE_PLUS_ONE', label: '1+1' },
  { value: 'TWO_PLUS_ONE', label: '2+1' },
  { value: 'SALE', label: '할인' },
  { value: 'OTHER', label: '기타 행사' },
];
const ConveniencePanel = ({ active, onDetail }: { active: boolean; onDetail: (detail: MealDetail) => void }) => {
  const [brand, setBrand] = useState<Brand>('EMART24');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [limit, setLimit] = useState(24);
  const query = usePromotions(brand, active);
  return (
    <section className={shared.section} aria-label="편의점 행사상품">
      <h2>편의점 행사상품</h2>
      <p className={shared.description}>지금 진행 중인 브랜드 행사 살펴보기</p>
      <SegmentedControl
        value={brand}
        onValueChange={(value) => {
          setBrand(value as Brand);
          setLimit(24);
        }}
        aria-label="편의점 브랜드"
      >
        {Object.entries(BRANDS).map(([value, label]) => (
          <SegmentedControlItem key={value} value={value}>
            {label}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <div className={shared.filters} role="group" aria-label="행사 유형">
        {filters.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => {
              setFilter(value);
              setLimit(24);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <QueryState query={query} loadingTitle="행사상품을 불러오고 있어요" describeError={describeMealError}>
        {(result) => {
          const products = result.products.filter(
            (product) =>
              filter === 'ALL' ||
              (filter === 'OTHER'
                ? ['THREE_PLUS_ONE', 'PICK_AND_MIX'].includes(product.promotionType)
                : product.promotionType === filter),
          );
          const source = httpsUrl(result.sourceUrl);
          return (
            <>
              <p className={shared.description} aria-live="polite">
                {BRANDS[brand]} · {products.length.toLocaleString('ko-KR')}개 상품
              </p>
              {products.length === 0 ? (
                <div className={shared.empty}>
                  <strong>
                    {result.collectedAt === null && result.count === 0
                      ? '아직 행사정보를 수집하지 않았어요'
                      : result.count === 0
                        ? '현재 등록된 행사상품이 없어요'
                        : '이 행사 유형의 상품이 없어요'}
                  </strong>
                  <p>
                    {result.collectedAt === null
                      ? '공식 행사 페이지에서 최신 정보를 확인해 주세요.'
                      : '다른 행사 유형이나 브랜드를 살펴보세요.'}
                  </p>
                </div>
              ) : (
                <ul className={styles.grid} aria-label="행사상품 목록">
                  {products.slice(0, limit).map((product, index) => (
                    <li key={`${index}-${product.name}-${product.promotionType}`}>
                      <button
                        type="button"
                        className={styles.card}
                        onClick={() => onDetail({ kind: 'product', product, brand, sourceUrl: result.sourceUrl })}
                        aria-label={`${product.name} 상세 보기`}
                      >
                        <ProductImage src={product.imageUrl} name={product.name} />
                        <span className={shared.badge}>{PROMOTIONS[product.promotionType]}</span>
                        <strong className={styles.name}>{product.name}</strong>
                        <span className={styles.price}>{won(product.price)}</span>
                        <small>판매가격</small>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {products.length > limit && (
                <Button fullWidth variant="secondary" onClick={() => setLimit((value) => value + 24)}>
                  상품 더 보기 ({Math.min(limit, products.length)}/{products.length})
                </Button>
              )}
              <footer className={shared.note}>
                <p>
                  마지막 수집:{' '}
                  {result.collectedAt === null ? '아직 수집되지 않음' : `${formatKst(result.collectedAt)} (한국 시간)`}
                </p>
                {source && (
                  <a href={source} target="_blank" rel="noreferrer">
                    {BRANDS[brand]} 공식 행사정보 ↗
                  </a>
                )}
                <p>
                  개별 매장에 따라 행사 적용과 재고가 다를 수 있어요. 표시한 금액은 상품 판매가격이며, 행사 조건은 공식
                  안내를 확인해 주세요.
                </p>
              </footer>
            </>
          );
        }}
      </QueryState>
    </section>
  );
};
const styles = {
  grid: css`
    label: ConveniencePanel-grid;
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.4rem 0.8rem;
  `,
  card: css`
    label: ConveniencePanel-card;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-ink);
    text-align: left;
    cursor: pointer;
    font: inherit;
    & small {
      color: var(--color-ink-soft);
      font-size: 0.72rem;
    }
  `,
  name: css`
    label: ConveniencePanel-name;
    font-size: 0.87rem;
    line-height: 1.5;
    overflow-wrap: anywhere;
  `,
  price: css`
    label: ConveniencePanel-price;
    font-weight: 800;
    font-size: 1.06rem;
    margin-top: auto;
  `,
};
export default ConveniencePanel;
