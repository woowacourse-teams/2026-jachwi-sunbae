import { describe, expect, it } from 'vitest';

import { parseGoodPriceResult } from '@/features/good-price/api/goodPriceApi';

const response = {
  center: { latitude: 37.5665, longitude: 126.978 },
  radius: 1000,
  count: 1,
  dataAsOf: '2026-06-30',
  stores: [
    {
      id: 1,
      name: '계약 검증 업소',
      businessType: '기타',
      phone: null,
      address: '테스트 주소',
      latitude: 37.5665,
      longitude: 126.978,
      distanceMeters: 0,
      menus: [
        { name: '범위', price: '25000~45000' },
        { name: '무료', price: '무료' },
        { name: '미등록', price: null },
      ],
    },
  ],
};

describe('착한가격업소 응답 계약', () => {
  it('가격 원문과 누락 값을 변경하지 않는다', () => {
    expect(parseGoodPriceResult(response)).toEqual(response);
  });
  it('진짜 빈 결과와 null 기준일을 유지한다', () => {
    const empty = { ...response, count: 0, stores: [], dataAsOf: null };
    expect(parseGoodPriceResult(empty)).toEqual(empty);
  });
  it('지원하지 않는 반경과 목록 개수 불일치는 오류다', () => {
    expect(() => parseGoodPriceResult({ ...response, radius: 750 })).toThrow();
    expect(() => parseGoodPriceResult({ ...response, count: 0 })).toThrow();
  });
  it('가격 숫자나 유효하지 않은 좌표를 임의 보정하지 않는다', () => {
    expect(() => parseGoodPriceResult({ ...response, stores: [{ ...response.stores[0], latitude: NaN }] })).toThrow();
    expect(() =>
      parseGoodPriceResult({
        ...response,
        stores: [{ ...response.stores[0], menus: [{ name: '가격', price: 5000 }] }],
      }),
    ).toThrow();
  });
});
