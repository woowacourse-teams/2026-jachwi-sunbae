package com.jachwisunbae.transit.controller.dto.response;

import com.jachwisunbae.transit.service.dto.result.CommuteAreaSearchResult;
import java.util.List;

public record CommuteRentAreaSearchResponse(int maxMinutes, int areaCount, RentPeriodResponse rentPeriod,
                                            List<CommuteRentAreaResponse> areas) {

    public static CommuteRentAreaSearchResponse from(final CommuteAreaSearchResult result) {
        List<CommuteRentAreaResponse> areas = result.areas().stream()
                .map(area -> CommuteRentAreaResponse.from(area, result.rents()))
                .toList();
        return new CommuteRentAreaSearchResponse(result.maxMinutes(), areas.size(),
                RentPeriodResponse.from(result.rents()), areas);
    }
}
