package com.jachwisunbae.deliverydiscount.controller.dto.response;

import com.jachwisunbae.deliverydiscount.domain.DeliveryDiscountOffer;
import com.jachwisunbae.deliverydiscount.domain.DeliveryPlatform;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record DeliveryDiscountOfferResponse(
        long id,
        DeliveryPlatform platform,
        String brandName,
        @Schema(description = "원 단위 할인금액", example = "7500")
        int discountAmount,
        @Schema(description = "원 단위 최소주문금액, 모르면 null", nullable = true, example = "22000")
        Integer minOrderAmount,
        @Schema(description = "행사 시작일, 모르면 null", nullable = true)
        LocalDate startDate,
        @Schema(description = "행사 종료일(당일 포함), 모르면 null", nullable = true, example = "2026-11-01")
        LocalDate endDate,
        @Schema(description = "추가 조건, 없으면 null", nullable = true)
        String conditions,
        @Schema(description = "마지막으로 할인정보를 확인한 KST 시각(오프셋 없음)", example = "2026-10-29T09:00:00")
        LocalDateTime lastVerifiedAt
) {

    public static DeliveryDiscountOfferResponse from(final DeliveryDiscountOffer offer) {
        return new DeliveryDiscountOfferResponse(offer.id(), offer.platform(), offer.brandName(),
                offer.discountAmount(), offer.minOrderAmount(), offer.startDate(), offer.endDate(),
                offer.conditions(), offer.lastVerifiedAt());
    }
}
