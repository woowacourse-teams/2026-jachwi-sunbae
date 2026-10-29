// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { parseDeliveryOffers, parsePromotionResult } from '@/features/meal-deals/api/mealDealsApi';
import { formatKst, httpsUrl } from '@/features/meal-deals/lib/presentation';

const product = { name: '도시락', price: 4200, imageUrl: '', category: 'UNKNOWN', promotionType: 'ONE_PLUS_ONE' };
const promotion = {
  brand: 'SEVEN_ELEVEN',
  count: 1,
  collectedAt: null,
  sourceUrl: 'https://www.7-eleven.co.kr/product/presentList.asp',
  products: [product],
};
const offer = {
  id: 1,
  platform: 'BAEMIN',
  brandName: '피자',
  discountAmount: 6000,
  minOrderAmount: null,
  startDate: null,
  endDate: null,
  conditions: null,
  lastVerifiedAt: '2026-10-29T09:00:00',
};

describe('행사 API 계약', () => {
  it('UNKNOWN 카테고리와 미수집 null을 보존하고 판매가격을 나누지 않는다', () => {
    expect(parsePromotionResult(promotion)).toEqual(promotion);
    expect(parsePromotionResult({ ...promotion, count: 0, products: [] }).collectedAt).toBeNull();
  });
  it.each(['ONE_PLUS_ONE', 'TWO_PLUS_ONE', 'THREE_PLUS_ONE', 'SALE', 'PICK_AND_MIX'])(
    '%s 행사를 누락하지 않는다',
    (promotionType) => {
      expect(
        parsePromotionResult({ ...promotion, products: [{ ...product, promotionType }] }).products[0].promotionType,
      ).toBe(promotionType);
    },
  );
  it('개수·enum·음수 가격·누락 필드가 잘못되면 응답 오류로 구분한다', () => {
    expect(() => parsePromotionResult({ ...promotion, count: 2 })).toThrow();
    expect(() => parsePromotionResult({ ...promotion, brand: 'INVALID' })).toThrow();
    expect(() => parsePromotionResult({ ...promotion, products: [{ ...product, price: -1 }] })).toThrow();
    expect(() => parsePromotionResult({ ...promotion, collectedAt: undefined })).toThrow();
  });
  it('배달 nullable 조건과 0원 최소 주문금액을 구별한다', () => {
    expect(parseDeliveryOffers([offer])).toEqual([offer]);
    expect(parseDeliveryOffers([{ ...offer, minOrderAmount: 0 }])[0].minOrderAmount).toBe(0);
    expect(parseDeliveryOffers([])).toEqual([]);
    expect(() => parseDeliveryOffers({ offers: [] })).toThrow();
    expect(() => parseDeliveryOffers([{ ...offer, discountAmount: '6000' }])).toThrow();
    expect(() => parseDeliveryOffers([{ ...offer, platform: 'INVALID' }])).toThrow();
  });
  it('한국 시간의 오프셋 유무를 모두 처리하고 안전한 HTTPS 링크만 쓴다', () => {
    expect(formatKst('2026-10-29T09:00:00')).toBe(formatKst('2026-10-29T09:00:00+09:00'));
    expect(httpsUrl('javascript:alert(1)')).toBeUndefined();
    expect(httpsUrl('https://user:pass@example.com')).toBeUndefined();
    expect(httpsUrl('https://example.com/a')).toBe('https://example.com/a');
  });
});
