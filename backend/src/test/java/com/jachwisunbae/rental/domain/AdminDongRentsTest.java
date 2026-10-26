package com.jachwisunbae.rental.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AdminDongRentsTest {

    @Test
    @DisplayName("행정동 거래의 월세·보증금 중앙값과 거래 수를 낸다")
    void calculatesMedian() {
        List<AdminDongRents.Deal> deals = new ArrayList<>();
        for (long rent : new long[] {400_000, 500_000, 450_000, 700_000, 300_000}) {
            deals.add(new AdminDongRents.Deal("11210630", "신림동", rent, rent * 10));
        }

        assertThat(AdminDongRents.calculate(deals))
            .containsExactly(new AdminDongRent("11210630", List.of("신림동"), 450_000, 4_500_000, 5));
    }

    @Test
    @DisplayName("여러 법정동을 관할하는 행정동은 거래를 모두 합치고 거래가 있던 법정동을 거래가 많은 순서로 담는다")
    void poolsLegalDongs() {
        List<AdminDongRents.Deal> deals = List.of(new AdminDongRents.Deal("11010615", "관수동", 500_000, 0),
            new AdminDongRents.Deal("11010615", "관철동", 600_000, 0),
            new AdminDongRents.Deal("11010615", "관철동", 700_000, 0),
            new AdminDongRents.Deal("11010615", "관철동", 800_000, 0),
            new AdminDongRents.Deal("11010615", "관수동", 900_000, 0));

        AdminDongRent rent = AdminDongRents.calculate(deals).getFirst();

        assertThat(rent.transactionCount()).isEqualTo(5);
        assertThat(rent.monthlyRentKrw()).isEqualTo(700_000);
        assertThat(rent.legalDongNames()).containsExactly("관철동", "관수동");
    }

    @Test
    @DisplayName("합친 거래가 5건보다 적으면 시세를 내지 않는다")
    void skipsFewTransactions() {
        List<AdminDongRents.Deal> deals = List.of(new AdminDongRents.Deal("11210630", "신림동", 500_000, 0),
            new AdminDongRents.Deal("11210630", "신림동", 500_000, 0),
            new AdminDongRents.Deal("11210630", "신림동", 500_000, 0),
            new AdminDongRents.Deal("11210630", "신림동", 500_000, 0));

        assertThat(AdminDongRents.calculate(deals)).isEmpty();
    }

    @Test
    @DisplayName("기간은 마지막 계약일부터 6개월 전까지다")
    void startsSixMonthsBefore() {
        assertThat(AdminDongRents.startDateOf(LocalDate.of(2026, 9, 30))).isEqualTo(LocalDate.of(2026, 3, 30));
    }

    @Test
    @DisplayName("중앙값은 짝수 개면 가운데 두 값의 평균을 반올림한다")
    void roundsEvenMedian() {
        assertThat(AdminDongRents.median(new long[] {3, 1, 2})).isEqualTo(2);
        assertThat(AdminDongRents.median(new long[] {1, 2, 3, 6})).isEqualTo(3);
        assertThat(AdminDongRents.median(new long[] {1, 4})).isEqualTo(3);
    }
}
