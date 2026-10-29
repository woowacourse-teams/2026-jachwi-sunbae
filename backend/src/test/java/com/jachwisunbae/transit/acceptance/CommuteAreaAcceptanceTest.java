package com.jachwisunbae.transit.acceptance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jachwisunbae.rental.domain.RentalSnapshot;
import com.jachwisunbae.rental.service.AdminDongRentService;
import com.jachwisunbae.rental.service.AdminLegalDongImportService;
import com.jachwisunbae.transit.service.AdminDongImportService;
import com.jachwisunbae.transit.service.GtfsImportService;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.MockMvcPrint;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

// 목적지 D 옆에 정류장 S(가동)가 있고, 버스 101이 I(인천) → N1(나동) → M(나동) → S로 간다.
@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc(print = MockMvcPrint.NONE)
@ActiveProfiles("test")
@Tag("acceptance")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class CommuteAreaAcceptanceTest {

    @Container
    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4.10");
    private static final MutableClock CLOCK = new MutableClock();
    private static final Path FIXTURE = createFixture();

    private static final String GA_DONG = "11010510";
    private static final String NA_DONG = "11010520";
    private static final String INCHEON_DONG = "23010510";
    private static final double DESTINATION_LATITUDE = 37.5000;
    private static final double DESTINATION_LONGITUDE = 127.0000;

    @Autowired
    private MockMvc mvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private AdminDongImportService adminDongImportService;
    @Autowired
    private GtfsImportService gtfsImportService;
    @Autowired
    private AdminLegalDongImportService adminLegalDongImportService;
    @Autowired
    private AdminDongRentService adminDongRentService;

    private List<Map<String, Object>> rentsCalculatedByRentalImport;
    private String accessToken;

    @DynamicPropertySource
    static void configure(final DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("transit.admin-dong.file", () -> FIXTURE.resolve("admin-dongs.geojson").toString());
        registry.add("transit.gtfs.directory", () -> FIXTURE.resolve("gtfs").toString());
        registry.add("transit.admin-legal-dong.file", () -> FIXTURE.resolve("KIKmix.20260701").toString());
    }

    @BeforeAll
    void importTransitAndRentData() throws Exception {
        adminDongImportService.importBoundaries();
        gtfsImportService.importFeed();
        adminLegalDongImportService.importLinks();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM admin_dong_rents", Integer.class)).isZero();

        insertRentalTransactions();
        adminDongRentService.refresh();
        rentsCalculatedByRentalImport = rentRows();
        adminLegalDongImportService.importLinks();
        adminDongRentService.load();

        // 서버가 뜰 때 비어 있던 노선망을 다시 읽을 수 있는 시각으로 옮긴다.
        CLOCK.advance(Duration.ofSeconds(31));
        accessToken = login();
    }

    @Test
    @DisplayName("[POL-COMMUTE-018] 생활권 탐색, 시세 탐색, 경로 안내는 Access Token 없이 쓸 수 없다")
    void requiresAccessToken() throws Exception {
        for (String path : List.of("/api/commute-areas", "/api/commute-areas/with-rents", "/api/commute-areas/route")) {
            mvc.perform(get(path).param("latitude", "37.5").param("longitude", "127.0").param("stopId", "N1"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("ACCESS_TOKEN_INVALID"));
        }
    }

    @Test
    @DisplayName("[POL-COMMUTE-023] 최대 통근 시간은 1~60분, 최대 환승은 0~2회이고 생략하면 60분·2회로 탐색한다")
    void validatesSearchRange() throws Exception {
        mvc.perform(search("/api/commute-areas").param("maxMinutes", "61"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
        mvc.perform(search("/api/commute-areas").param("maxTransfers", "3"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
        mvc.perform(search("/api/commute-areas"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.maxMinutes").value(60));
    }

    @Test
    @DisplayName("[POL-COMMUTE-013] 목적지에서 걸어서 10분 안에 정류장이 없으면 탐색하지 않는다")
    void rejectsUnreachableDestination() throws Exception {
        mvc.perform(authorized(get("/api/commute-areas")).param("latitude", "37.6").param("longitude", "127.1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMUTE_DESTINATION_UNREACHABLE"));
    }

    @Test
    @DisplayName("[POL-COMMUTE-014·015·019·024] 서울·경기 동네만 통근 시간 순으로 정류장과 함께 보여 준다")
    void searchesCommuteAreas() throws Exception {
        JsonNode data = data(mvc.perform(search("/api/commute-areas")).andExpect(status().isOk()));

        JsonNode areas = data.path("areas");
        assertThat(texts(areas, "adminDongCode")).containsExactly(GA_DONG, NA_DONG).doesNotContain(INCHEON_DONG);
        assertThat(areas.get(0).path("commuteMinutes").asInt()).isEqualTo(1);
        JsonNode naDong = areas.get(1);
        assertThat(fieldNames(naDong)).containsExactly("adminDongCode", "commuteMinutes", "stations");
        assertThat(texts(naDong.path("stations"), "stopId")).containsExactly("M", "N1");
        assertThat(texts(naDong.path("stations"), "stopName")).containsExactly("중간정류장", "북쪽정류장");
        assertThat(naDong.path("commuteMinutes").asInt())
                .isEqualTo(naDong.path("stations").get(0).path("travelMinutes").asInt());
    }

    @Test
    @DisplayName("[POL-COMMUTE-020·021·022] 탐색 결과 정류장의 경로는 버스 구간과 목적지까지 걷는 구간이고 통근 시간이 탐색과 같다")
    void findsRouteWithSameCommuteTime() throws Exception {
        JsonNode areas = data(mvc.perform(search("/api/commute-areas")).andExpect(status().isOk())).path("areas");
        int searchedMinutes = areas.get(1).path("stations").get(1).path("travelMinutes").asInt();

        JsonNode route = data(mvc.perform(search("/api/commute-areas/route").param("stopId", "N1"))
                .andExpect(status().isOk()));

        assertThat(route.path("totalMinutes").asInt()).isEqualTo(searchedMinutes);
        assertThat(texts(route.path("legs"), "type")).containsExactly("BUS", "WALK");
        assertThat(route.path("transferCount").asInt()).isZero();
    }

    @Test
    @DisplayName("[POL-COMMUTE-029·032·034] 시세 탐색은 관할 법정동 거래를 합친 중앙값을 붙이고 5건 미만인 동네는 비운다")
    void searchesWithRents() throws Exception {
        JsonNode data = data(mvc.perform(search("/api/commute-areas/with-rents")).andExpect(status().isOk()));

        assertThat(data.path("rentStartDate").asText()).isEqualTo("2026-03-30");
        assertThat(data.path("rentEndDate").asText()).isEqualTo("2026-09-30");
        JsonNode gaDong = data.path("areas").get(0);
        assertThat(gaDong.path("monthlyRentKrw").asLong()).isEqualTo(600_000);
        assertThat(gaDong.path("depositKrw").asLong()).isEqualTo(6_000_000);
        assertThat(gaDong.path("transactionCount").asInt()).isEqualTo(5);
        assertThat(texts(gaDong.path("legalDongNames"))).containsExactly("청운동", "효자동");
        JsonNode naDong = data.path("areas").get(1);
        assertThat(naDong.path("monthlyRentKrw").isNull()).isTrue();
        assertThat(naDong.path("legalDongNames")).isEmpty();
    }

    @Test
    @DisplayName("[POL-COMMUTE-034] 사용 중단한 기존 탐색은 시세 없이 응답 형식을 그대로 유지한다")
    void keepsDeprecatedResponse() throws Exception {
        JsonNode data = data(mvc.perform(search("/api/commute-areas")).andExpect(status().isOk()));

        assertThat(fieldNames(data)).containsExactly("maxMinutes", "areaCount", "areas");
    }

    @Test
    @DisplayName("[POL-COMMUTE-031·033] 월세 적재와 연계표 적재 중 무엇이 나중에 와도 같은 시세가 저장된다")
    void recalculatesSameRentsInEitherOrder() {
        assertThat(rentsCalculatedByRentalImport).isNotEmpty().isEqualTo(rentRows());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM admin_legal_dongs", Integer.class)).isEqualTo(3);
    }

    @Test
    @DisplayName("[POL-COMMUTE-025·027] 매물별 통근 시간은 내 삭제하지 않은 매물만 ID 내림차순으로 상태와 함께 준다")
    void findsCommuteTimesOfOwnProperties() throws Exception {
        String token = login();
        long memberId = jdbc.queryForObject("SELECT MAX(id) FROM members", Long.class);
        long near = insertProperty(memberId, "북쪽 원룸", 37.5202, 127.0000);
        long noLocation = insertProperty(memberId, "위치 없는 집", null, null);
        long far = insertProperty(memberId, "먼 집", 37.6000, 127.1000);
        long deleted = insertProperty(memberId, "삭제한 집", 37.5202, 127.0000);
        jdbc.update("UPDATE properties SET deleted_at = NOW(6) WHERE id = ?", deleted);
        insertProperty(memberId - 1, "남의 집", 37.5202, 127.0000);

        JsonNode properties = data(mvc.perform(get("/api/properties/commute-times")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .param("latitude", String.valueOf(DESTINATION_LATITUDE))
                        .param("longitude", String.valueOf(DESTINATION_LONGITUDE)))
                .andExpect(status().isOk())).path("properties");

        assertThat(longs(properties, "propertyId")).containsExactly(far, noLocation, near);
        assertThat(texts(properties, "status")).containsExactly("UNREACHABLE", "NO_LOCATION", "REACHABLE");
        assertThat(properties.get(2).path("commuteMinutes").asInt()).isPositive();
        assertThat(properties.get(0).path("commuteMinutes").isNull()).isTrue();
    }

    private MockHttpServletRequestBuilder search(final String path) {
        return authorized(get(path)).param("latitude", String.valueOf(DESTINATION_LATITUDE))
                .param("longitude", String.valueOf(DESTINATION_LONGITUDE));
    }

    private MockHttpServletRequestBuilder authorized(final MockHttpServletRequestBuilder request) {
        return request.header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken);
    }

    private String login() throws Exception {
        return data(mvc.perform(post("/api/auth/login")).andExpect(status().isOk())).path("accessToken").asText();
    }

    private JsonNode data(final ResultActions result) throws Exception {
        return objectMapper.readTree(result.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8))
                .path("data");
    }

    private List<Map<String, Object>> rentRows() {
        return jdbc.queryForList("SELECT * FROM admin_dong_rents ORDER BY admin_dong_code");
    }

    private void insertRentalTransactions() {
        jdbc.update("INSERT INTO legal_dongs (code, name) VALUES ('1111010100', '서울특별시 종로구 청운동'), "
                + "('1111010200', '서울특별시 종로구 효자동'), ('1111010300', '서울특별시 종로구 사직동')");
        jdbc.update("""
                INSERT INTO rental_datasets (dataset_key, transaction_sha256, legal_dong_sha256,
                    contract_from, contract_to, collected_at, imported_at, row_count)
                VALUES (?, ?, ?, '2025-10-01', '2026-09-30', '2026-10-01 00:00:00', UTC_TIMESTAMP(6), 10)
                """, RentalSnapshot.DATASET_KEY, "a".repeat(64), "b".repeat(64));
        int row = 1;
        for (long rent : new long[] {500_000, 600_000, 700_000}) {
            insertTransaction("1111010100", rent, "2026-07-01", row++);
        }
        for (long rent : new long[] {400_000, 800_000}) {
            insertTransaction("1111010200", rent, "2026-07-01", row++);
        }
        for (long rent : new long[] {500_000, 500_000, 500_000, 500_000}) {
            insertTransaction("1111010300", rent, "2026-07-01", row++);
        }
        insertTransaction("1111010100", 9_900_000, "2026-01-01", row);
    }

    private void insertTransaction(final String legalDongCode, final long monthlyRent, final String contractDate,
                                   final int rowNumber) {
        jdbc.update("""
                INSERT INTO rental_transactions (dataset_key, legal_dong_code, housing_type, deposit_amount_krw,
                    monthly_rent_amount_krw, area_m2, contract_date, contract_type, building_name, floor,
                    contract_period, source_file, source_row_number)
                VALUES (?, ?, 'ROWHOUSE', ?, ?, 20, ?, 'NEW', '빌라', '3', '', 'raw/source.csv', ?)
                """, RentalSnapshot.DATASET_KEY, legalDongCode, monthlyRent * 10, monthlyRent, contractDate,
                rowNumber);
    }

    private long insertProperty(final long memberId, final String name, final Double latitude,
                                final Double longitude) {
        jdbc.update("""
                INSERT INTO properties (member_id, name, latitude, longitude, created_at)
                VALUES (?, ?, ?, ?, NOW(6))
                """, memberId, name, latitude, longitude);
        return jdbc.queryForObject("SELECT MAX(id) FROM properties", Long.class);
    }

    private static List<String> texts(final JsonNode array, final String field) {
        List<String> values = new ArrayList<>();
        array.forEach(node -> values.add(node.path(field).asText()));
        return values;
    }

    private static List<String> texts(final JsonNode array) {
        List<String> values = new ArrayList<>();
        array.forEach(node -> values.add(node.asText()));
        return values;
    }

    private static List<Long> longs(final JsonNode array, final String field) {
        List<Long> values = new ArrayList<>();
        array.forEach(node -> values.add(node.path(field).asLong()));
        return values;
    }

    private static List<String> fieldNames(final JsonNode node) {
        List<String> names = new ArrayList<>();
        node.fieldNames().forEachRemaining(names::add);
        return names;
    }

    private static Path createFixture() {
        try {
            Path directory = Files.createTempDirectory("commute-area-acceptance");
            Files.writeString(directory.resolve("admin-dongs.geojson"), """
                    {"type":"FeatureCollection","features":[%s,%s,%s]}
                    """.formatted(
                    dong(GA_DONG, "가동", "서울특별시", "종로구", 37.495, 37.505),
                    dong(NA_DONG, "나동", "서울특별시", "종로구", 37.505, 37.540),
                    dong(INCHEON_DONG, "다동", "인천광역시", "중구", 37.540, 37.560)));
            Path gtfs = Files.createDirectories(directory.resolve("gtfs"));
            Files.writeString(gtfs.resolve("routes.txt"), """
                    route_id,route_short_name,route_long_name,route_type
                    R1,101,간선 101,3
                    """);
            Files.writeString(gtfs.resolve("trips.txt"), """
                    route_id,service_id,trip_id
                    R1,W,T11
                    R1,W,T12
                    R1,W,T13
                    """);
            StringBuilder stopTimes = new StringBuilder("trip_id,arrival_time,departure_time,stop_id,stop_sequence\n");
            for (int trip = 0; trip < 3; trip++) {
                int start = trip * 10;
                stopTimes.append(stopTime("T1" + (trip + 1), start, "I", 1))
                        .append(stopTime("T1" + (trip + 1), start + 5, "N1", 2))
                        .append(stopTime("T1" + (trip + 1), start + 10, "M", 3))
                        .append(stopTime("T1" + (trip + 1), start + 15, "S", 4));
            }
            Files.writeString(gtfs.resolve("stop_times.txt"), stopTimes);
            Files.writeString(gtfs.resolve("stops.txt"), """
                    stop_id,stop_name,stop_lat,stop_lon
                    S,목적지앞,37.5005,127.0000
                    M,중간정류장,37.5100,127.0000
                    N1,북쪽정류장,37.5200,127.0000
                    I,인천정류장,37.5500,127.0000
                    """);
            Files.writeString(gtfs.resolve("transfers.txt"), "from_stop_id,to_stop_id,transfer_type,min_transfer_time\n");
            Files.write(directory.resolve("KIKmix.20260701"), kikMix(
                    kikMixRow("서울특별시", "종로구", "가동", "1111010100", "청운동"),
                    kikMixRow("서울특별시", "종로구", "가동", "1111010200", "효자동"),
                    kikMixRow("서울특별시", "종로구", "나동", "1111010300", "사직동")));
            return directory;
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        }
    }

    private static String dong(final String code, final String name, final String sido, final String sigungu,
                               final double south, final double north) {
        return """
                {"type":"Feature","properties":{"code":"%s","name":"%s","sidoName":"%s","sigunguName":"%s",\
                "fullName":"%s %s %s","baseDate":"20250630"},"geometry":{"type":"Polygon","coordinates":\
                [[[126.990,%s],[127.010,%s],[127.010,%s],[126.990,%s],[126.990,%s]]]}}"""
                .formatted(code, name, sido, sigungu, sido, sigungu, name, south, south, north, north, south);
    }

    private static String stopTime(final String trip, final int minutesAfterSix, final String stopId,
                                   final int sequence) {
        String time = "%02d:%02d:00".formatted(6 + minutesAfterSix / 60, minutesAfterSix % 60);
        return "%s,%s,%s,%s,%d%n".formatted(trip, time, time, stopId, sequence);
    }

    private static byte[] kikMix(final String... rows) {
        Charset ms949 = Charset.forName("MS949");
        StringBuilder text = new StringBuilder(kikMixLine("행정동코드", "시도명", "시군구명", "읍면동명", "법정동코드",
                "동리명", "생성일자", "말소일자")).append('\n');
        for (String row : rows) {
            text.append(row).append('\n');
        }
        return text.toString().getBytes(ms949);
    }

    private static String kikMixRow(final String sido, final String sigungu, final String eupMyeonDong,
                                    final String legalDongCode, final String legalDongName) {
        return kikMixLine("1111000000", sido, sigungu, eupMyeonDong, legalDongCode, legalDongName, "19880423", "");
    }

    // 연계표는 MS949 바이트 기준 고정 폭이라 열마다 바이트 길이로 공백을 채운다.
    private static String kikMixLine(final String... values) {
        int[] widths = {10, 30, 30, 30, 10, 30, 8, 8};
        Charset ms949 = Charset.forName("MS949");
        StringBuilder line = new StringBuilder();
        for (int index = 0; index < values.length; index++) {
            line.append(values[index]).append(" ".repeat(widths[index] - values[index].getBytes(ms949).length + 1));
        }
        return line.toString();
    }

    @TestConfiguration
    static class ClockConfig {
        @Bean
        @Primary
        Clock commuteAreaAcceptanceClock() {
            return CLOCK;
        }
    }

    private static class MutableClock extends Clock {
        private final AtomicReference<Instant> now = new AtomicReference<>(Instant.now());

        void advance(final Duration duration) {
            now.updateAndGet(instant -> instant.plus(duration));
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(final ZoneId zone) {
            return Clock.fixed(instant(), zone);
        }

        @Override
        public Instant instant() {
            return now.get();
        }
    }
}
