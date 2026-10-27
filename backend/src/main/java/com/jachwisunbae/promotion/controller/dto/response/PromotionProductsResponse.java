package com.jachwisunbae.promotion.controller.dto.response;

import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.service.dto.result.PromotionProductsResult;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Schema(description = "브랜드별 저장된 행사상품 전체 목록. 미수집 시 count=0, collectedAt=null, products=[]입니다.")
public record PromotionProductsResponse(
        @Schema(description = "조회한 편의점 브랜드") ConvenienceBrand brand,
        @Schema(description = "반환한 전체 행사상품 수") int count,
        @Schema(description = "마지막 정상 수집 시각(KST, +09:00). 미수집 시 null",
                type = "string", format = "date-time", nullable = true,
                example = "2026-10-27T14:14:47+09:00") OffsetDateTime collectedAt,
        @Schema(description = "DB 저장 순서의 전체 행사상품 목록") List<PromotionProductResponse> products
) {

    public static PromotionProductsResponse from(final PromotionProductsResult result) {
        List<PromotionProductResponse> products = result.products().stream().map(PromotionProductResponse::from).toList();
        // DB의 LocalDateTime은 이미 KST다. UTC로 해석해 시간을 이동하지 않고 오프셋을 명시한다.
        OffsetDateTime collectedAt = result.collectedAt() == null ? null
                : result.collectedAt().atOffset(ZoneOffset.ofHours(9));
        return new PromotionProductsResponse(result.brand(), products.size(), collectedAt, products);
    }
}
