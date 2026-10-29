import type { Brand, DeliveryOffer, Product } from '@/features/meal-deals/model/MealDeal';

export const MEAL_TABS = { all: '전체', restaurant: '식당', convenience: '편의점', delivery: '배달' } as const;
export type MealTab = keyof typeof MEAL_TABS;
export type MealDetail =
  { kind: 'product'; product: Product; brand: Brand; sourceUrl: string } | { kind: 'delivery'; offer: DeliveryOffer };
