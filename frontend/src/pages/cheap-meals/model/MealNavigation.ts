import type { Brand, DeliveryOffer, Product } from '@/features/meal-deals/model/MealDeal';

/** 한 끼 카테고리. 고를 카드만 늘어놓던 `전체` 탭 없이 식당부터 바로 보여 준다. */
export const MEAL_TABS = { restaurant: '식당', convenience: '편의점', delivery: '배달' } as const;
export const DEFAULT_MEAL_TAB = 'restaurant';
export type MealTab = keyof typeof MEAL_TABS;
export type MealDetail =
  { kind: 'product'; product: Product; brand: Brand; sourceUrl: string } | { kind: 'delivery'; offer: DeliveryOffer };
