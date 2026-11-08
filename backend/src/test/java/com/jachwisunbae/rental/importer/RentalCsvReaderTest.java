package com.jachwisunbae.rental.importer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jachwisunbae.rental.domain.AreaBasis;
import com.jachwisunbae.rental.domain.ContractType;
import com.jachwisunbae.rental.domain.HousingType;
import com.jachwisunbae.rental.domain.RentalTransaction;
import com.jachwisunbae.rental.domain.vo.LegalDong;
import com.jachwisunbae.rental.domain.vo.RentalSource;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class RentalCsvReaderTest {

    private static final String HEADER = "legal_dong,housing_type,deposit_10k_krw,monthly_rent_10k_krw,area_m2,"
            + "area_basis,contract_date,contract_type,building_name,floor,contract_period,source_file,"
            + "source_row_number\n";
    private static final LegalDongCatalog CATALOG = new LegalDongCatalog(
            Map.of("서울특별시 관악구 신림동", "1162010200"));

    @TempDir
    private Path directory;

    private final RentalCsvReader reader = new RentalCsvReader();

    @Test
    @DisplayName("BOM이 붙은 CSV를 읽어 만원 단위 금액을 원으로 바꾸고 법정동 코드를 붙인다")
    void readsTransactionsWithBom() throws IOException {
        // given
        Path csv = write("﻿" + HEADER
                + "서울특별시 관악구 신림동,연립다세대,500,45,20.5,exclusive,2026-10-01,신규,신림빌라,3,"
                + "202610~202810,rent.csv,2\n");

        // when
        RentalCsvReader.Result result = reader.read(csv, CATALOG);

        // then
        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.unmatched()).isEmpty();
        RentalTransaction transaction = result.transactions().getFirst();
        assertThat(transaction.legalDong()).isEqualTo(new LegalDong("1162010200", "서울특별시 관악구 신림동"));
        assertThat(transaction.housingType()).isEqualTo(HousingType.ROWHOUSE);
        assertThat(transaction.price().depositAmountKrw()).isEqualTo(5_000_000L);
        assertThat(transaction.price().monthlyRentAmountKrw()).isEqualTo(450_000L);
        assertThat(transaction.area().areaM2()).isEqualByComparingTo(new BigDecimal("20.5"));
        assertThat(transaction.area().areaBasis()).isEqualTo(AreaBasis.EXCLUSIVE);
        assertThat(transaction.contractDate()).isEqualTo(LocalDate.parse("2026-10-01"));
        assertThat(transaction.contractType()).isEqualTo(ContractType.NEW);
        assertThat(transaction.source()).isEqualTo(new RentalSource("rent.csv", 2));
    }

    @Test
    @DisplayName("카탈로그에 없는 법정동은 거래로 만들지 않고 이름별로 센다")
    void countsUnmatchedLegalDongs() throws IOException {
        // given
        Path csv = write(HEADER
                + "서울특별시 관악구 신림동,연립다세대,500,45,20,exclusive,2026-10-01,신규,가,1,-,rent.csv,2\n"
                + "서울특별시 없는구 없는동,연립다세대,500,45,20,exclusive,2026-10-01,신규,나,1,-,rent.csv,3\n"
                + "서울특별시  없는구 없는동,연립다세대,500,45,20,exclusive,2026-10-01,신규,다,1,-,rent.csv,4\n");

        // when
        RentalCsvReader.Result result = reader.read(csv, CATALOG);

        // then
        assertThat(result.totalRows()).isEqualTo(3);
        assertThat(result.transactions()).hasSize(1);
        assertThat(result.unmatched()).containsExactly(Map.entry("서울특별시 없는구 없는동", 2));
    }

    @Test
    @DisplayName("필수 헤더가 없으면 거부한다")
    void rejectsMissingHeader() throws IOException {
        // given
        Path csv = write("legal_dong,housing_type\n서울특별시 관악구 신림동,연립다세대\n");

        // when // then
        assertThatThrownBy(() -> reader.read(csv, CATALOG))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("필수 헤더");
    }

    @Test
    @DisplayName("원본 파일과 행 번호가 같은 행이 두 번 나오면 거부한다")
    void rejectsDuplicateSourceRow() throws IOException {
        // given
        Path csv = write(HEADER
                + "서울특별시 관악구 신림동,연립다세대,500,45,20,exclusive,2026-10-01,신규,가,1,-,rent.csv,2\n"
                + "서울특별시 관악구 신림동,연립다세대,500,50,20,exclusive,2026-10-02,신규,가,1,-,rent.csv,2\n");

        // when // then
        assertThatThrownBy(() -> reader.read(csv, CATALOG))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("중복");
    }

    @Test
    @DisplayName("열 수가 헤더와 다르면 거부한다")
    void rejectsInconsistentColumns() throws IOException {
        // given
        Path csv = write(HEADER + "서울특별시 관악구 신림동,연립다세대,500\n");

        // when // then
        assertThatThrownBy(() -> reader.read(csv, CATALOG))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("열 수");
    }

    @Test
    @DisplayName("거래 값이 규칙을 어기면 거부한다")
    void rejectsInvalidTransactionValue() throws IOException {
        // given
        Path csv = write(HEADER
                + "서울특별시 관악구 신림동,아파트,500,45,20,exclusive,2026-10-01,신규,가,1,-,rent.csv,2\n");

        // when // then
        assertThatThrownBy(() -> reader.read(csv, CATALOG))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("CSV 거래 값이 올바르지 않습니다");
    }

    @Test
    @DisplayName("거래가 한 건도 없으면 거부한다")
    void rejectsEmptyCsv() throws IOException {
        // given
        Path csv = write(HEADER);

        // when // then
        assertThatThrownBy(() -> reader.read(csv, CATALOG))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("비어 있습니다");
    }

    private Path write(final String content) throws IOException {
        return Files.writeString(directory.resolve("transactions.csv"), content, StandardCharsets.UTF_8);
    }
}
