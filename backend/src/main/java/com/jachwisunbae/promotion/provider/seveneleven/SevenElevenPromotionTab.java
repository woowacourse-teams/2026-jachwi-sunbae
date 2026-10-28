package com.jachwisunbae.promotion.provider.seveneleven;

import com.jachwisunbae.promotion.domain.PromotionType;

// 세븐일레븐 행사상품 페이지의 행사 탭과 공통 행사 유형을 연결한다.
// 증정행사 탭(pTab=3)은 상품·증정 조건을 검증하지 못해 수집하지 않는다.
enum SevenElevenPromotionTab {
    ONE_PLUS_ONE("1", "1+1", "1+1", 10, PromotionType.ONE_PLUS_ONE),
    TWO_PLUS_ONE("2", "2+1", "2+1", 10, PromotionType.TWO_PLUS_ONE),
    SALE("4", "할인행사", "할인", 10, PromotionType.SALE);

    private final String code;
    private final String title;
    private final String badge;
    private final int moreSize;
    private final PromotionType promotionType;

    SevenElevenPromotionTab(final String code, final String title, final String badge, final int moreSize,
                            final PromotionType promotionType) {
        this.code = code;
        this.title = title;
        this.badge = badge;
        this.moreSize = moreSize;
        this.promotionType = promotionType;
    }

    String code() {
        return code;
    }

    // 첫 화면 목록의 첫 번째 항목에 표시되는 탭 제목
    String title() {
        return title;
    }

    // 상품 카드의 행사 배지
    String badge() {
        return badge;
    }

    // 더보기 요청 한 번에 받는 상품 수
    int moreSize() {
        return moreSize;
    }

    PromotionType promotionType() {
        return promotionType;
    }
}
