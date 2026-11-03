package com.jachwisunbae.rental.domain.vo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jachwisunbae.rental.domain.AreaBasis;
import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class RentalValueObjectsTest {
    @Test
    @DisplayName("면적은 입력 소수 자릿수와 관계없이 같은 값으로 비교하고 정밀도를 유지한다")
    void areaEqualityIgnoresInputScaleWithoutLosingPrecision() {
        RentalArea area = new RentalArea(new BigDecimal("20"), AreaBasis.EXCLUSIVE);

        assertThat(area).isEqualTo(new RentalArea(new BigDecimal("20.00000"), AreaBasis.EXCLUSIVE));
        assertThat(area.areaM2()).hasScaleOf(4);
        assertThat(area).isNotEqualTo(new RentalArea(new BigDecimal("20"), AreaBasis.CONTRACT));
    }

    @Test
    @DisplayName("법정동은 전체 이름을 유지하고 150자를 넘는 이름을 거부한다")
    void legalDongKeepsFullNameAndRejectsNamesThatCannotBeStored() {
        String fullName = "서울특별시 관악구 신림동";
        LegalDong legalDong = new LegalDong("1162010200", fullName);

        assertThat(legalDong).isEqualTo(new LegalDong("1162010200", fullName));
        assertThat(legalDong).isNotEqualTo(new LegalDong("1162010100", fullName));
        assertThat(new LegalDong("1162010200", "가".repeat(150)).name()).hasSize(150);
        assertThatThrownBy(() -> new LegalDong("1162010200", "가".repeat(151)))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new LegalDong("1162010200", " "))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @ParameterizedTest
    @DisplayName("10자리 숫자가 아닌 법정동 코드를 거부한다")
    @ValueSource(strings = {"123", "abcdefghij", "11620102000"})
    void rejectsInvalidLegalDongCodes(final String code) {
        assertThatThrownBy(() -> new LegalDong(code, "서울특별시 관악구 신림동"))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("월세가 있으면 보증금 0원을 허용한다")
    void zeroDepositIsAllowedForPositiveMonthlyRent() {
        RentalPrice price = new RentalPrice(0, 1);

        assertThat(price.depositAmountKrw()).isZero();
        assertThat(price.monthlyRentAmountKrw()).isOne();
    }

    @Test
    @DisplayName("원본 식별은 정확한 파일 이름과 행 번호로 하고 255자를 넘는 파일 이름을 거부한다")
    void sourceIdentityIncludesExactFileNameAndRowNumber() {
        RentalSource source = new RentalSource("raw/source.csv", 1);

        assertThat(source).isEqualTo(new RentalSource("raw/source.csv", 1));
        assertThat(source).isNotEqualTo(new RentalSource("raw/other.csv", 1));
        assertThat(source).isNotEqualTo(new RentalSource("raw/source.csv", 2));
        assertThat(new RentalSource(" raw/source.csv ", 1).sourceFile()).isEqualTo(" raw/source.csv ");
        assertThat(new RentalSource("a".repeat(255), 1).sourceFile()).hasSize(255);
        assertThatThrownBy(() -> new RentalSource("a".repeat(256), 1)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new RentalSource(" ", 1)).isInstanceOf(IllegalArgumentException.class);
    }

    @ParameterizedTest
    @DisplayName("0 이하의 원본 행 번호를 거부한다")
    @ValueSource(longs = {0, -1})
    void rejectsNonPositiveSourceRowNumbers(final long rowNumber) {
        assertThatThrownBy(() -> new RentalSource("raw/source.csv", rowNumber))
            .isInstanceOf(IllegalArgumentException.class);
    }
}
