package com.jachwisunbae.promotion.controller.dto.response;

import com.jachwisunbae.promotion.domain.ProductCategory;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import com.jachwisunbae.promotion.domain.PromotionType;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "저장된 행사상품. 교체 시 바뀌는 DB 내부 ID는 노출하지 않습니다.")
public record PromotionProductResponse(
        @Schema(description = "상품명") String name,
        @Schema(description = "원 단위 판매가격", example = "2500") int price,
        @Schema(description = "공식 상품 이미지 URL") String imageUrl,
        @Schema(description = "공통 상품 카테고리. 공식 분류를 확인할 수 없으면 UNKNOWN(미분류)") ProductCategory category,
        @Schema(description = "공통 행사 유형") PromotionType promotionType
) {

    public static PromotionProductResponse from(final PromotionProduct product) {
        return new PromotionProductResponse(product.name(), product.price(), product.imageUrl(), product.category(),
                product.promotionType());
    }
}
