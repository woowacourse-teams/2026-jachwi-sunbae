package com.jachwisunbae.rental.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AdminDongRentsTest {

    private static final LocalDate START = LocalDate.of(2026, 4, 25);
    private static final LocalDate END = LocalDate.of(2026, 10, 25);

    // 서원동은 신림동 하나를, 종로1·2·3·4가동은 관철동·관수동·인사동을 관할한다.
    private final List<AdminLegalDong> links = List.of(
        new AdminLegalDong("11210630", "1162010200", "신림동"),
        new AdminLegalDong("11010615", "1111013800", "관철동"),
        new AdminLegalDong("11010615", "1111013900", "관수동"),
        new AdminLegalDong("11010615", "1111013700", "인사동"));

    @Test
    @DisplayName("관할 법정동 거래의 월세·보증금 중앙값과 거래 수를 붙인다")
    void attachesMedian() {
        List<RentalPricePoint> prices = new ArrayList<>();
        for (long rent : new long[] {400_000, 500_000, 450_000, 700_000, 300_000}) {
            prices.add(new RentalPricePoint("1162010200", rent, rent * 10));
        }

        AdminDongRent rent = AdminDongRents.of(links, prices, START, END).find("11210630").orElseThrow();

        assertThat(rent).isEqualTo(new AdminDongRent(List.of(new AdminDongRent.LegalDong("1162010200", "신림동")),
            450_000, 4_500_000, 5));
    }

    @Test
    @DisplayName("여러 법정동을 관할하는 행정동은 거래를 모두 합치고 거래가 있던 법정동을 거래가 많은 순서로 담는다")
    void poolsLegalDongs() {
        List<RentalPricePoint> prices = List.of(new RentalPricePoint("1111013900", 500_000, 0),
            new RentalPricePoint("1111013800", 600_000, 0), new RentalPricePoint("1111013800", 700_000, 0),
            new RentalPricePoint("1111013800", 800_000, 0), new RentalPricePoint("1111013900", 900_000, 0));

        AdminDongRent rent = AdminDongRents.of(links, prices, START, END).find("11010615").orElseThrow();

        assertThat(rent.transactionCount()).isEqualTo(5);
        assertThat(rent.monthlyRentKrw()).isEqualTo(700_000);
        assertThat(rent.legalDongs()).extracting(AdminDongRent.LegalDong::name).containsExactly("관철동", "관수동");
    }

    @Test
    @DisplayName("합친 거래가 5건보다 적으면 시세를 내지 않는다")
    void skipsFewTransactions() {
        List<RentalPricePoint> prices = List.of(new RentalPricePoint("1162010200", 500_000, 0),
            new RentalPricePoint("1162010200", 500_000, 0), new RentalPricePoint("1162010200", 500_000, 0),
            new RentalPricePoint("1162010200", 500_000, 0));

        AdminDongRents rents = AdminDongRents.of(links, prices, START, END);

        assertThat(rents.find("11210630")).isEmpty();
        assertThat(rents.queryStartDate()).isEqualTo(START);
    }

    @Test
    @DisplayName("중앙값은 짝수 개면 가운데 두 값의 평균을 반올림한다")
    void roundsEvenMedian() {
        assertThat(AdminDongRents.median(new long[] {3, 1, 2})).isEqualTo(2);
        assertThat(AdminDongRents.median(new long[] {1, 2, 3, 6})).isEqualTo(3);
        assertThat(AdminDongRents.median(new long[] {1, 4})).isEqualTo(3);
    }
}
