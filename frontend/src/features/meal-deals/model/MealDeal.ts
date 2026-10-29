export const BRANDS = { EMART24: '이마트24', SEVEN_ELEVEN: '세븐일레븐' } as const;
export const PLATFORMS = { BAEMIN: '배민', COUPANG_EATS: '쿠팡이츠' } as const;
export const PROMOTIONS = {
  ONE_PLUS_ONE: '1+1',
  TWO_PLUS_ONE: '2+1',
  THREE_PLUS_ONE: '3+1',
  SALE: '할인',
  PICK_AND_MIX: '골라담기',
} as const;
export const CATEGORIES = {
  MEAL: '간편식',
  SNACK: '과자',
  BEVERAGE: '음료',
  HOUSEHOLD_GOODS: '생활용품',
  UNKNOWN: '카테고리 정보 없음',
} as const;
export type Brand = keyof typeof BRANDS;
export type Platform = keyof typeof PLATFORMS;
export type Promotion = keyof typeof PROMOTIONS;
export type Product = {
  name: string;
  price: number;
  imageUrl: string;
  category: keyof typeof CATEGORIES;
  promotionType: Promotion;
};
export type PromotionResult = {
  brand: Brand;
  count: number;
  collectedAt: string | null;
  sourceUrl: string;
  products: Product[];
};
export type DeliveryOffer = {
  id: number;
  platform: Platform;
  brandName: string;
  discountAmount: number;
  minOrderAmount: number | null;
  startDate: string | null;
  endDate: string | null;
  conditions: string | null;
  lastVerifiedAt: string;
};
