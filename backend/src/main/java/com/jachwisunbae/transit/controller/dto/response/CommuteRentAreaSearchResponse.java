package com.jachwisunbae.transit.controller.dto.response;

import com.jachwisunbae.transit.service.dto.result.CommuteAreaSearchResult;
import java.time.LocalDate;
import java.util.List;

// rentStartDate와 rentEndDate는 시세를 낸 거래 기간이고, 시세가 하나도 없으면 null이다.
public record CommuteRentAreaSearchResponse(int maxMinutes, int areaCount, LocalDate rentStartDate,
                                            LocalDate rentEndDate, List<CommuteRentAreaResponse> areas) {

    public static CommuteRentAreaSearchResponse from(final CommuteAreaSearchResult result) {
        List<CommuteRentAreaResponse> areas = result.areas().stream()
                .map(area -> CommuteRentAreaResponse.from(area, result.rents()))
                .toList();
        return new CommuteRentAreaSearchResponse(result.maxMinutes(), areas.size(), result.rents().startDate(),
                result.rents().endDate(), areas);
    }
}
