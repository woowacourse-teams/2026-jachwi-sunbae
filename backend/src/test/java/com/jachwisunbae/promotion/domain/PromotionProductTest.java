package com.jachwisunbae.promotion.domain;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class PromotionProductTest {

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "/image.jpg", "data:image/png;base64,test", "https://[invalid"})
    @DisplayName("행사상품은 공개 이미지의 절대 HTTP 주소를 가져야 한다")
    void requiresAbsoluteImageUrl(final String imageUrl) {
        assertThatThrownBy(() -> new PromotionProduct(ConvenienceBrand.EMART24, "상품", 1000, imageUrl,
                ProductCategory.MEAL, PromotionType.ONE_PLUS_ONE)).isInstanceOf(IllegalArgumentException.class);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = " ")
    @DisplayName("행사상품은 비어 있지 않은 이름을 가져야 한다")
    void requiresName(final String name) {
        assertThatThrownBy(() -> new PromotionProduct(ConvenienceBrand.EMART24, name, 1000,
                "https://emart24.co.kr/image.jpg", ProductCategory.MEAL, PromotionType.ONE_PLUS_ONE))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @ParameterizedTest
    @ValueSource(ints = {-1, Integer.MIN_VALUE})
    @DisplayName("행사상품 가격은 음수일 수 없다")
    void rejectsNegativePrice(final int price) {
        assertThatThrownBy(() -> new PromotionProduct(ConvenienceBrand.EMART24, "상품", price,
                "https://emart24.co.kr/image.jpg", ProductCategory.MEAL, PromotionType.ONE_PLUS_ONE))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
