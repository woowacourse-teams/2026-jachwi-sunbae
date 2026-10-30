import type { LogParams } from '@/shared/lib/analytics/logging';

/**
 * 저렴한 한 끼 UT 퍼널 이벤트. 진입 → 카테고리 선택 → 상세 확인을 기본 퍼널로 보고, 외부 이동은 따로 본다.
 * 상품명, 위치, 검색어 같은 원문은 싣지 않는다. UT 참가자 번호(`ut_session_id`)는 수집 계층이 공통으로 붙인다.
 */
export const CHEAP_MEAL_EVENTS = {
  /** 저렴한 한 끼 화면이 실제로 그려졌을 때. StrictMode의 중복 effect는 LogScreen이 한 번으로 막는다. */
  viewed: 'cheap_meal_viewed',
  /** 사용자가 카테고리를 직접 골랐을 때만. 첫 탭이나 주소로 복원한 탭은 기록하지 않는다. */
  categorySelected: 'cheap_meal_category_selected',
  /** 상품, 할인, 가게 상세가 실제로 열렸을 때. 목록 응답을 미리 받은 것만으로는 기록하지 않는다. */
  detailViewed: 'cheap_meal_detail_viewed',
  /** 공식 출처, 전화, 길찾기처럼 서비스 밖으로 나가는 링크를 눌렀을 때. */
  outboundClicked: 'cheap_meal_outbound_clicked',
} as const;

export type CheapMealCategory = 'restaurant' | 'convenience' | 'delivery';
export type CheapMealCategorySource = 'top_tab';
export type CheapMealOutboundDestination = 'directions' | 'phone' | 'official_source';

export const categorySelectedParams = (category: CheapMealCategory, source: CheapMealCategorySource): LogParams => ({
  category,
  source,
});

/** provider는 편의점 브랜드(EMART24 등)나 배달 플랫폼(BAEMIN 등) 코드다. 가게 상세에는 없다. */
export const detailViewedParams = (category: CheapMealCategory, provider?: string): LogParams => ({
  category,
  ...(provider === undefined ? {} : { provider }),
});

export const outboundClickedParams = (
  category: CheapMealCategory,
  destination: CheapMealOutboundDestination,
  provider?: string,
): LogParams => ({
  category,
  destination,
  ...(provider === undefined ? {} : { provider }),
});
