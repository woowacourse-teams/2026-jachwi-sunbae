package com.jachwisunbae.transit.controller.dto.response;

import com.jachwisunbae.rental.domain.AdminDongRent;
import com.jachwisunbae.rental.domain.AdminDongRents;
import com.jachwisunbae.transit.domain.CommuteArea;
import java.util.List;
import java.util.Optional;

// 생활권 동네에 월세 시세를 붙인 응답이다. 관할 법정동 거래를 합친 월세·보증금 중앙값과 거래 수이고,
// legalDongNames는 거래가 있던 관할 법정동을 거래가 많은 순서로 담는다. 시세가 없으면 금액과 거래 수는 null이다.
public record CommuteRentAreaResponse(String adminDongCode, int commuteMinutes, Long monthlyRentKrw,
                                      Long depositKrw, Integer transactionCount, List<String> legalDongNames,
                                      List<CommuteStationResponse> stations) {

    public static CommuteRentAreaResponse from(final CommuteArea area, final AdminDongRents rents) {
        Optional<AdminDongRent> rent = rents.find(area.adminDongCode());
        return new CommuteRentAreaResponse(area.adminDongCode(), area.commuteMinutes(),
                rent.map(AdminDongRent::monthlyRentKrw).orElse(null),
                rent.map(AdminDongRent::depositKrw).orElse(null),
                rent.map(AdminDongRent::transactionCount).orElse(null),
                rent.map(AdminDongRent::legalDongNames).orElse(List.of()),
                area.stations().stream().map(CommuteStationResponse::from).toList());
    }
}
