package com.jachwisunbae.transit.controller.dto.response;

import com.jachwisunbae.rental.domain.AdminDongRents;

// 동네 시세를 계산한 실거래 계약일 기간이다. 시세가 하나도 없으면 응답하지 않는다.
public record RentPeriodResponse(String startDate, String endDate) {

    public static RentPeriodResponse from(final AdminDongRents rents) {
        if (rents.isEmpty()) {
            return null;
        }
        return new RentPeriodResponse(rents.queryStartDate().toString(), rents.queryEndDate().toString());
    }
}
