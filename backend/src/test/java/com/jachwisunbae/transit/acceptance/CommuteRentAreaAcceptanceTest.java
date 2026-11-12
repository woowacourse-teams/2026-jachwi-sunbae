package com.jachwisunbae.transit.acceptance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jachwisunbae.rental.service.AdminDongRentService;
import com.jachwisunbae.transit.service.AdminDongImportService;
import com.jachwisunbae.transit.service.GtfsImportService;
import com.jachwisunbae.transit.support.MutableClock;
import com.jachwisunbae.transit.support.MutableClockConfig;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.MockMvcPrint;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
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

// 목적지 옆 정류장 S가 있는 남가동과, 버스 101로 15분 걸리는 정류장 N이 있는 북가동이 있다.
// 시세는 북가동에만 있다.
@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc(print = MockMvcPrint.NONE)
@ActiveProfiles("test")
@Tag("acceptance")
@Import(MutableClockConfig.class)
class CommuteRentAreaAcceptanceTest {

    @Container
    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4.10");
    private static final Path FIXTURE = createFixture();
    private static final String SOUTH_DONG = "11010510";
    private static final String NORTH_DONG = "11010520";

    @Autowired
    private MutableClock clock;
    @Autowired
    private MockMvc mvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private AdminDongImportService adminDongImportService;
    @Autowired
    private GtfsImportService gtfsImportService;
    @Autowired
    private AdminDongRentService adminDongRentService;

    private String accessToken;

    @DynamicPropertySource
    static void configure(final DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("transit.admin-dong.file", () -> FIXTURE.resolve("admin-dongs.geojson").toString());
        registry.add("transit.gtfs.directory", () -> FIXTURE.resolve("gtfs").toString());
    }

    @BeforeEach
    void setUp() throws Exception {
        adminDongImportService.importBoundaries();
        gtfsImportService.importFeed();
        clock.advance(Duration.ofSeconds(31));
        jdbcTemplate.update("DELETE FROM admin_dong_rents");
        jdbcTemplate.update("""
                INSERT INTO admin_dong_rents (admin_dong_code, legal_dong_names, monthly_rent_krw, deposit_krw,
                    transaction_count, rent_start_date, rent_end_date)
                VALUES (?, '북법정동,옆법정동', 450000, 5000000, 7, '2026-04-09', '2026-10-09')
                """, NORTH_DONG);
        adminDongRentService.load();
        accessToken = data(mvc.perform(post("/api/auth/login")).andExpect(status().isOk()))
                .path("accessToken").asText();
    }

    @Test
    @DisplayName("동네마다 월세 시세를 붙이고, 시세가 없는 동네는 금액과 거래 수를 비운다")
    void attachesRentsToAreas() throws Exception {
        // when
        JsonNode result = data(mvc.perform(search()).andExpect(status().isOk()));

        // then
        assertThat(result.path("rentStartDate").asText()).isEqualTo("2026-04-09");
        assertThat(result.path("rentEndDate").asText()).isEqualTo("2026-10-09");
        assertThat(result.path("areaCount").asInt()).isEqualTo(2);
        JsonNode north = area(result, NORTH_DONG);
        assertThat(north.path("monthlyRentKrw").asLong()).isEqualTo(450_000L);
        assertThat(north.path("depositKrw").asLong()).isEqualTo(5_000_000L);
        assertThat(north.path("transactionCount").asInt()).isEqualTo(7);
        assertThat(north.path("legalDongNames").get(0).asText()).isEqualTo("북법정동");
        assertThat(north.path("legalDongNames").get(1).asText()).isEqualTo("옆법정동");
        assertThat(north.path("stations").get(0).path("stopId").asText()).isEqualTo("N");
        JsonNode south = area(result, SOUTH_DONG);
        assertThat(south.path("monthlyRentKrw").isNull()).isTrue();
        assertThat(south.path("transactionCount").isNull()).isTrue();
        assertThat(south.path("legalDongNames")).isEmpty();
    }

    @Test
    @DisplayName("시세가 하나도 없으면 시세 기간과 금액을 비운 채 동네를 준다")
    void returnsAreasWithoutRents() throws Exception {
        // given
        jdbcTemplate.update("DELETE FROM admin_dong_rents");
        adminDongRentService.load();

        // when
        JsonNode result = data(mvc.perform(search()).andExpect(status().isOk()));

        // then
        assertThat(result.path("rentStartDate").isNull()).isTrue();
        assertThat(result.path("rentEndDate").isNull()).isTrue();
        assertThat(area(result, NORTH_DONG).path("monthlyRentKrw").isNull()).isTrue();
    }

    @Test
    @DisplayName("최대 통근 시간이 60분을 넘으면 거부한다")
    void rejectsTooLongCommute() throws Exception {
        // when // then
        mvc.perform(search().param("maxMinutes", "61"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
    }

    @Test
    @DisplayName("목적지 주변에 정류장이 없으면 거부한다")
    void rejectsUnreachableDestination() throws Exception {
        // when // then
        mvc.perform(get("/api/commute-areas/with-rents")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                        .param("latitude", "37.0000").param("longitude", "127.5000"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMUTE_DESTINATION_UNREACHABLE"));
    }

    private MockHttpServletRequestBuilder search() {
        return get("/api/commute-areas/with-rents")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .param("latitude", "37.5000").param("longitude", "127.0000");
    }

    private JsonNode area(final JsonNode result, final String adminDongCode) {
        for (JsonNode area : result.path("areas")) {
            if (area.path("adminDongCode").asText().equals(adminDongCode)) {
                return area;
            }
        }
        throw new AssertionError("동네가 응답에 없습니다. adminDongCode=" + adminDongCode);
    }

    private JsonNode data(final ResultActions result) throws Exception {
        return objectMapper.readTree(result.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8))
                .path("data");
    }

    private static Path createFixture() {
        try {
            Path directory = Files.createTempDirectory("commute-rent-area-acceptance");
            Files.writeString(directory.resolve("admin-dongs.geojson"), """
                    {"type":"FeatureCollection","features":[\
                    {"type":"Feature","properties":{"code":"11010510","name":"남가동","sidoName":"서울특별시",\
                    "sigunguName":"종로구","fullName":"서울특별시 종로구 남가동","baseDate":"20250630"},\
                    "geometry":{"type":"Polygon","coordinates":\
                    [[[126.990,37.495],[127.010,37.495],[127.010,37.510],[126.990,37.510],[126.990,37.495]]]}},\
                    {"type":"Feature","properties":{"code":"11010520","name":"북가동","sidoName":"서울특별시",\
                    "sigunguName":"종로구","fullName":"서울특별시 종로구 북가동","baseDate":"20250630"},\
                    "geometry":{"type":"Polygon","coordinates":\
                    [[[126.990,37.510],[127.010,37.510],[127.010,37.530],[126.990,37.530],[126.990,37.510]]]}}]}
                    """);
            Path gtfs = Files.createDirectories(directory.resolve("gtfs"));
            Files.writeString(gtfs.resolve("routes.txt"), """
                    route_id,route_short_name,route_long_name,route_type
                    R1,101,간선 101,3
                    """);
            Files.writeString(gtfs.resolve("trips.txt"), """
                    route_id,service_id,trip_id
                    R1,W,T11
                    R1,W,T12
                    """);
            Files.writeString(gtfs.resolve("stop_times.txt"), """
                    trip_id,arrival_time,departure_time,stop_id,stop_sequence
                    T11,06:00:00,06:00:00,N,1
                    T11,06:15:00,06:15:00,S,2
                    T12,06:10:00,06:10:00,N,1
                    T12,06:25:00,06:25:00,S,2
                    """);
            Files.writeString(gtfs.resolve("stops.txt"), """
                    stop_id,stop_name,stop_lat,stop_lon
                    S,목적지앞,37.5005,127.0000
                    N,북쪽정류장,37.5200,127.0000
                    """);
            Files.writeString(gtfs.resolve("transfers.txt"), "from_stop_id,to_stop_id,transfer_type,min_transfer_time\n");
            return directory;
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        }
    }
}
