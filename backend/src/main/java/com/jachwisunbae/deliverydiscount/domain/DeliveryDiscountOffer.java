package com.jachwisunbae.deliverydiscount.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;

// 배달 플랫폼에서 확인한 브랜드 할인정보 한 건을 표현한다. 모르는 값은 null이다.
public record DeliveryDiscountOffer(
        long id,
        DeliveryPlatform platform,
        String brandName,
        int discountAmount,
        Integer minOrderAmount,
        LocalDate startDate,
        LocalDate endDate,
        String conditions,
        LocalDateTime lastVerifiedAt
) {
}
