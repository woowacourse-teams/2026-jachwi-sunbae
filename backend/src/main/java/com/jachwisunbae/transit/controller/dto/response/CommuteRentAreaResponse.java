package com.jachwisunbae.transit.controller.dto.response;

import com.jachwisunbae.rental.domain.AdminDongRents;
import com.jachwisunbae.transit.domain.CommuteArea;
import java.util.List;

// 생활권 동네에 대표 법정동 시세를 붙인 응답이다. 시세가 없으면 rent는 null이다.
public record CommuteRentAreaResponse(String adminDongCode, int commuteMinutes, CommuteAreaRentResponse rent,
                                      List<CommuteStationResponse> stations) {

    public static CommuteRentAreaResponse from(final CommuteArea area, final AdminDongRents rents) {
        return new CommuteRentAreaResponse(area.adminDongCode(), area.commuteMinutes(),
                rents.find(area.adminDongCode()).map(CommuteAreaRentResponse::from).orElse(null),
                area.stations().stream().map(CommuteStationResponse::from).toList());
    }
}
