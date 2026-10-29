import { useQuery } from '@tanstack/react-query';

import { ApiError, apiRequest } from '@/features/auth/api/apiClient';
import {
  readArray,
  readInteger,
  readNullableInteger,
  readNullableString,
  readRecord,
  readString,
} from '@/shared/api/responseParsers';
import { usePublicConfig } from '@/shared/config/PublicConfigContext';
import type { PublicConfig } from '@/shared/config/publicConfigTypes';

import type { Brand, DeliveryOffer, PromotionResult } from '../model/MealDeal';
import { BRANDS, CATEGORIES, PLATFORMS, PROMOTIONS } from '../model/MealDeal';

const member = <T extends string>(value: string, values: Record<T, string>): T => {
  if (!Object.prototype.hasOwnProperty.call(values, value)) throw new Error('지원하지 않는 행사 응답입니다.');
  return value as T;
};

export const parsePromotionResult = (value: unknown): PromotionResult => {
  const data = readRecord(value);
  const products = readArray(data, 'products').map((value) => {
    const product = readRecord(value);
    return {
      name: readString(product, 'name'),
      price: readInteger(product, 'price'),
      imageUrl: readString(product, 'imageUrl', { allowEmpty: true }),
      category: member(readString(product, 'category'), CATEGORIES),
      promotionType: member(readString(product, 'promotionType'), PROMOTIONS),
    };
  });
  const count = readInteger(data, 'count');
  if (count !== products.length) throw new Error('상품 개수가 응답과 일치하지 않습니다.');
  return {
    brand: member(readString(data, 'brand'), BRANDS),
    count,
    products,
    collectedAt: readNullableString(data, 'collectedAt'),
    sourceUrl: readString(data, 'sourceUrl'),
  };
};

export const parseDeliveryOffers = (value: unknown): DeliveryOffer[] => {
  if (!Array.isArray(value)) throw new Error('배달 할인 목록이 필요합니다.');
  return value.map((value) => {
    const offer = readRecord(value);
    return {
      id: readInteger(offer, 'id'),
      platform: member(readString(offer, 'platform'), PLATFORMS),
      brandName: readString(offer, 'brandName'),
      discountAmount: readInteger(offer, 'discountAmount'),
      minOrderAmount: readNullableInteger(offer, 'minOrderAmount'),
      startDate: readNullableString(offer, 'startDate'),
      endDate: readNullableString(offer, 'endDate'),
      conditions: readNullableString(offer, 'conditions', { allowEmpty: true }),
      lastVerifiedAt: readString(offer, 'lastVerifiedAt'),
    };
  });
};

export const fetchPromotions = (config: PublicConfig, brand: Brand, signal?: AbortSignal) =>
  apiRequest({
    config,
    path: `/api/promotions?brand=${brand}`,
    signal,
    parseData: (value) => {
      const result = parsePromotionResult(value);
      if (result.brand !== brand) throw new Error('요청한 브랜드와 응답이 다릅니다.');
      return result;
    },
  });
export const fetchDeliveryOffers = (config: PublicConfig, signal?: AbortSignal) =>
  apiRequest({ config, path: '/api/delivery-discount-offers', signal, parseData: parseDeliveryOffers });

export const usePromotions = (brand: Brand, isEnabled: boolean) => {
  const config = usePublicConfig();
  return useQuery({
    queryKey: ['promotions', config.apiBaseUrl, brand],
    enabled: isEnabled,
    queryFn: ({ signal }) => fetchPromotions(config, brand, signal),
    staleTime: 300_000,
  });
};
export const useDeliveryOffers = (isEnabled: boolean) => {
  const config = usePublicConfig();
  return useQuery({
    queryKey: ['delivery-discount-offers', config.apiBaseUrl],
    enabled: isEnabled,
    queryFn: ({ signal }) => fetchDeliveryOffers(config, signal),
    staleTime: 300_000,
  });
};
export const describeMealError = (error: unknown) => ({
  title:
    error instanceof ApiError && error.kind === 'authentication-ended'
      ? '로그인 연결을 다시 확인해 주세요'
      : '정보를 불러오지 못했어요',
  description: '연결 상태를 확인하고 다시 시도해 주세요.',
  canRetry: !(error instanceof ApiError && error.kind === 'authentication-ended'),
});
