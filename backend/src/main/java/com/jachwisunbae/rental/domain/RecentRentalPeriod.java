package com.jachwisunbae.rental.domain;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

// 월세 거래를 조회하는 기간이다. 한국 날짜로 오늘부터 6개월 전까지다.
// 거래 목록과 행정동 시세가 같은 기간을 쓰도록 한곳에서 정한다.
public record RecentRentalPeriod(LocalDate startDate, LocalDate endDate) {

    private static final ZoneId KOREA = ZoneId.of("Asia/Seoul");

    public static RecentRentalPeriod of(final Clock clock) {
        LocalDate endDate = LocalDate.now(clock.withZone(KOREA));
        return new RecentRentalPeriod(endDate.minusMonths(6), endDate);
    }
}
