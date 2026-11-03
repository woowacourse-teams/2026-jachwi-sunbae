package com.jachwisunbae.rental.acceptance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jachwisunbae.support.TestClock;
import com.jachwisunbae.support.TestClockConfig;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestClockConfig.class)
@Tag("acceptance")
class RentalTransactionAcceptanceTest {
    @Container
    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4.10");
    private static final Instant NOW = Instant.parse("2026-10-10T15:30:00Z");

    @Autowired
    private TestClock clock;

    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private MockMvc mvc;
    @Autowired
    private ObjectMapper objectMapper;
    private String accessToken;

    @DynamicPropertySource
    static void configureDatabase(final DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> MYSQL.getJdbcUrl()
            + "?connectionTimeZone=%2B00:00&forceConnectionTimeZoneToSession=true&preserveInstants=true");
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
    }

    @BeforeEach
    void setUpTransactions() throws Exception {
        clock.set(NOW);
        jdbc.update("DELETE FROM rental_transactions");
        jdbc.update("DELETE FROM rental_datasets");
        jdbc.update("DELETE FROM legal_dongs");
        jdbc.update("INSERT INTO legal_dongs (code, name) VALUES (?, ?), (?, ?)",
            "1162010200", "서울특별시 관악구 신림동", "1162010100", "서울특별시 관악구 봉천동");
        jdbc.update("""
            INSERT INTO rental_datasets (dataset_key, transaction_sha256, legal_dong_sha256,
                contract_from, contract_to, collected_at, imported_at, row_count)
            VALUES ('seoul-eastern-gyeonggi', ?, ?, '2026-04-11', '2026-10-11', '2026-10-10 15:00:00', UTC_TIMESTAMP(6), 5)
            """, "a".repeat(64), "b".repeat(64));
        insert("2026-04-10", 1);
        insert("2026-04-11", 2);
        insert("2026-10-11", 3);
        insert("2026-10-11", 4);
        insert("2026-10-12", 5);

        var login = mvc.perform(post("/api/auth/login"))
            .andExpect(status().isOk())
            .andReturn();
        accessToken = objectMapper.readTree(login.getResponse().getContentAsString())
            .path("data").path("accessToken").asText();
    }

    @Test
    @DisplayName("한국 날짜 기준 조회 기간의 거래를 금액·면적 기준과 함께 최신순으로 돌려준다")
    void returnsKoreanDateWindowAmountsAreaBasisAndStableLatestOrder() throws Exception {
        var response = mvc.perform(request().param("size", "2"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.code").value("SUCCESS"))
            .andExpect(jsonPath("$.data.legalDongName").value("서울특별시 관악구 신림동"))
            .andExpect(jsonPath("$.data.referenceLabel").value("소형 주택 월세 참고 정보"))
            .andExpect(jsonPath("$.data.queryStartDate").value("2026-04-11"))
            .andExpect(jsonPath("$.data.queryEndDate").value("2026-10-11"))
            .andExpect(jsonPath("$.data.totalCount").value(3))
            .andExpect(jsonPath("$.data.items.length()").value(2))
            .andExpect(jsonPath("$.data.items[0].contractDate").value("2026-10-11"))
            .andExpect(jsonPath("$.data.items[0].depositAmountKrw").value(5000000))
            .andExpect(jsonPath("$.data.items[0].monthlyRentAmountKrw").value(450000))
            .andExpect(jsonPath("$.data.items[0].areaBasis").value("EXCLUSIVE"))
            .andExpect(jsonPath("$.data.items[0].contractType").value("NEW"))
            .andExpect(jsonPath("$.data.items[0].price").doesNotExist())
            .andExpect(jsonPath("$.data.items[0].area").doesNotExist())
            .andExpect(jsonPath("$.data.items[0].legalDong").doesNotExist())
            .andExpect(jsonPath("$.data.items[0].source").doesNotExist())
            .andExpect(jsonPath("$.data.items[0].sourceFile").doesNotExist())
            .andExpect(jsonPath("$.data.items[0].sourceRowNumber").doesNotExist())
            .andExpect(jsonPath("$.data.hasNext").value(true)).andReturn();

        var items = objectMapper.readTree(response.getResponse().getContentAsString()).path("data").path("items");
        assertThat(items.get(0).path("rentalTransactionId").asLong())
            .isGreaterThan(items.get(1).path("rentalTransactionId").asLong());
    }

    @Test
    @DisplayName("다음 페이지는 같은 계약일의 거래를 중복하지 않고 이어서 돌려준다")
    void returnsNextPageWithoutRepeatingSameDateTransactions() throws Exception {
        mvc.perform(request().param("size", "2").param("page", "1"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.items.length()").value(1))
            .andExpect(jsonPath("$.data.items[0].contractDate").value("2026-04-11"))
            .andExpect(jsonPath("$.data.totalCount").value(3)).andExpect(jsonPath("$.data.hasNext").value(false));
    }

    @Test
    @DisplayName("마지막 페이지 뒤를 요청하면 빈 목록을 돌려준다")
    void returnsEmptyPageAfterLastPage() throws Exception {
        mvc.perform(request().param("page", "10000"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.items").isEmpty())
            .andExpect(jsonPath("$.data.totalCount").value(3)).andExpect(jsonPath("$.data.hasNext").value(false));
    }

    @Test
    @DisplayName("거래가 없는 법정동도 법정동 이름은 돌려준다")
    void returnsKnownDongNameWhenNoTransactionsExist() throws Exception {
        mvc.perform(baseRequest().param("legalDongCode", "1162010100"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.items").isEmpty())
            .andExpect(jsonPath("$.data.legalDongName").value("서울특별시 관악구 봉천동"))
            .andExpect(jsonPath("$.data.totalCount").value(0)).andExpect(jsonPath("$.data.hasNext").value(false));
    }

    @Test
    @DisplayName("수집 정보가 없는 법정동은 이름 없이 빈 목록을 돌려준다")
    void returnsEmptyListForDongWithoutCollectedInformation() throws Exception {
        mvc.perform(baseRequest().param("legalDongCode", "9999999999"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.items").isEmpty())
            .andExpect(jsonPath("$.data.legalDongName").isEmpty()).andExpect(jsonPath("$.data.totalCount").value(0));
    }

    @Test
    @DisplayName("자료 기간과 수집 시각은 조회 기간과 따로 돌려준다")
    void returnsCoverageAndCollectionTimeSeparatelyFromQueryWindow() throws Exception {
        jdbc.update("UPDATE rental_datasets SET contract_from = '2026-04-09', contract_to = '2026-10-09'");

        mvc.perform(request())
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.queryStartDate").value("2026-04-11"))
            .andExpect(jsonPath("$.data.queryEndDate").value("2026-10-11"))
            .andExpect(jsonPath("$.data.datasetPeriodStart").value("2026-04-09"))
            .andExpect(jsonPath("$.data.datasetPeriodEnd").value("2026-10-09"))
            .andExpect(jsonPath("$.data.collectedAt").value("2026-10-10T15:00:00Z"));
    }

    @Test
    @DisplayName("단독주택은 계약면적, 오피스텔은 전용면적 기준을 그대로 돌려준다")
    void preservesContractAreaForDetachedHomesAndExclusiveAreaForOfficetels() throws Exception {
        jdbc.update("""
            UPDATE rental_transactions SET housing_type = 'DETACHED'
            WHERE source_row_number = 4
            """);
        jdbc.update("UPDATE rental_transactions SET housing_type = 'OFFICETEL' WHERE source_row_number = 3");

        mvc.perform(request()).andExpect(status().isOk())
            .andExpect(jsonPath("$.data.items[0].housingType").value("DETACHED"))
            .andExpect(jsonPath("$.data.items[0].areaBasis").value("CONTRACT"))
            .andExpect(jsonPath("$.data.items[0].areaM2").value(20))
            .andExpect(jsonPath("$.data.items[1].housingType").value("OFFICETEL"))
            .andExpect(jsonPath("$.data.items[1].areaBasis").value("EXCLUSIVE"));
    }

    @Test
    @DisplayName("처음 적재하기 전에는 빈 목록과 빈 수집 정보를 돌려준다")
    void returnsEmptyListBeforeFirstImport() throws Exception {
        jdbc.update("DELETE FROM rental_transactions");
        jdbc.update("DELETE FROM rental_datasets");

        mvc.perform(request()).andExpect(status().isOk()).andExpect(jsonPath("$.data.items").isEmpty())
            .andExpect(jsonPath("$.data.collectedAt").isEmpty()).andExpect(jsonPath("$.data.datasetPeriodStart").isEmpty());
    }

    @ParameterizedTest
    @DisplayName("10자리 숫자가 아닌 법정동 코드는 거부한다")
    @ValueSource(strings = {"123", "abcdefghij", "11620102000", "1162010200'"})
    void rejectsInvalidDongCode(final String code) throws Exception {
        mvc.perform(baseRequest().param("legalDongCode", code)).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("RENTAL_QUERY_INVALID"));
    }

    @ParameterizedTest
    @DisplayName("범위를 벗어난 페이지 번호와 크기는 거부한다")
    @CsvSource({"page,-1", "page,10001", "size,0", "size,101"})
    void rejectsPageBounds(final String parameter, final String value) throws Exception {
        mvc.perform(request().param(parameter, value)).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("RENTAL_QUERY_INVALID"));
    }

    @Test
    @DisplayName("법정동 코드가 없거나 페이지가 숫자가 아니면 요청 오류로 거부한다")
    void rejectsMissingCodeAndNonNumericPage() throws Exception {
        mvc.perform(baseRequest()).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
        mvc.perform(request().param("page", "abc")).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
    }

    @Test
    @DisplayName("인증 없이 월세 거래를 조회하면 거부한다")
    void rejectsTransactionsWithoutAuthentication() throws Exception {
        mvc.perform(get("/api/rental-transactions").param("legalDongCode", "1162010200"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("ACCESS_TOKEN_INVALID"));
    }

    @Test
    @DisplayName("저장된 거래 정보가 잘못되면 서버 오류로 응답한다")
    void treatsInvalidStoredTransactionAsServerError() throws Exception {
        jdbc.update("UPDATE legal_dongs SET name = '' WHERE code = '1162010200'");

        mvc.perform(request()).andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.code").value("INTERNAL_SERVER_ERROR"))
            .andExpect(jsonPath("$.message").value("서버 내부 오류가 발생했습니다."));
    }

    private MockHttpServletRequestBuilder baseRequest() {
        return get("/api/rental-transactions")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken);
    }

    private MockHttpServletRequestBuilder request() {
        return baseRequest().param("legalDongCode", "1162010200");
    }

    private void insert(final String contractDate, final long rowNumber) {
        jdbc.update("""
            INSERT INTO rental_transactions (dataset_key, legal_dong_code, housing_type, deposit_amount_krw,
                monthly_rent_amount_krw, area_m2, contract_date, contract_type,
                building_name, floor, contract_period, source_file, source_row_number)
            VALUES ('seoul-eastern-gyeonggi', '1162010200', 'ROWHOUSE', 5000000, 450000, 20, ?, 'NEW',
                '신림빌라', '3', '', 'raw/source.csv', ?)
            """, contractDate, rowNumber);
    }
}
