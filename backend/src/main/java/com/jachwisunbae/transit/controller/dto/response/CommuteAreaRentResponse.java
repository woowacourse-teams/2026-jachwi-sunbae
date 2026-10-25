package com.jachwisunbae.transit.controller.dto.response;

import com.jachwisunbae.rental.domain.AdminDongRent;
import java.util.List;

// 동네의 월세 시세다. 실거래가 법정동 단위라 동네(행정동)가 관할하는 법정동 거래를 합쳐 계산하고,
// legalDongs에 거래가 있었던 관할 법정동을 거래가 많은 순서로 담는다.
public record CommuteAreaRentResponse(List<LegalDongResponse> legalDongs, long monthlyRentKrw, long depositKrw,
                                      int transactionCount) {

    public static CommuteAreaRentResponse from(final AdminDongRent rent) {
        return new CommuteAreaRentResponse(rent.legalDongs().stream()
                .map(legalDong -> new LegalDongResponse(legalDong.code(), legalDong.name()))
                .toList(), rent.monthlyRentKrw(), rent.depositKrw(), rent.transactionCount());
    }

    public record LegalDongResponse(String code, String name) {
    }
}
