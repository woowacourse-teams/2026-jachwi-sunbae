package com.jachwisunbae.map.provider.publicdata;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.queryParam;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.ResponseCreator;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriUtils;

class SgisAddressClientTest {

    private static final Instant NOW = Instant.parse("2026-09-26T00:00:00Z");
    private static final String AUTH = "/OpenAPI3/auth/authentication.json";
    private static final String GEOCODE = "/OpenAPI3/addr/geocodewgs84.json";
    private static final String REVERSE_GEOCODE = "/OpenAPI3/addr/rgeocodewgs84.json";

    private final MutableClock clock = new MutableClock(NOW);
    private MockRestServiceServer server;
    private SgisAddressClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://sgisapi.mods.go.kr");
        server = MockRestServiceServer.bindTo(builder).build();
        client = new SgisAddressClient(builder.build(), "consumer-key", "consumer-secret", clock);
    }

    @Test
    @DisplayName("토큰을 발급받아 주소를 WGS84 좌표로 변환한다")
    void geocodesAddressWithIssuedToken() {
        expectToken("token-1", NOW.plus(Duration.ofHours(4)));
        server.expect(requestTo(Matchers.containsString(GEOCODE)))
                .andExpect(queryParam("accessToken", "token-1"))
                .andExpect(queryParam("address", encode("경기도 성남시 분당구 판교역로 166")))
                .andExpect(queryParam("resultcount", "1"))
                .andRespond(success("""
                        {"errCd": 0, "result": {"resultdata": [{"x": "127.1103669", "y": "37.3954408"}]}}
                        """));

        assertThat(client.geocode("경기도 성남시 분당구 판교역로 166"))
                .contains(new SgisCoordinate(new BigDecimal("37.3954408"), new BigDecimal("127.1103669")));
        server.verify();
    }

    @Test
    @DisplayName("좌표를 도로명주소로 변환한다")
    void reverseGeocodesCoordinateToRoadAddress() {
        expectToken("token-1", NOW.plus(Duration.ofHours(4)));
        server.expect(requestTo(Matchers.containsString(REVERSE_GEOCODE)))
                .andExpect(queryParam("accessToken", "token-1"))
                .andExpect(queryParam("x_coor", "127.1109"))
                .andExpect(queryParam("y_coor", "37.3952"))
                .andExpect(queryParam("addr_type", "10"))
                .andRespond(success("""
                        {"errCd": 0, "result": [{"full_addr": "경기도 성남시 분당구 분당내곡로 121"}]}
                        """));

        assertThat(client.reverseGeocode(new BigDecimal("37.3952"), new BigDecimal("127.1109")))
                .contains("경기도 성남시 분당구 분당내곡로 121");
        server.verify();
    }

    @Test
    @DisplayName("만료 전이면 발급받은 토큰을 다시 사용한다")
    void reusesTokenBeforeExpiry() {
        expectToken("token-1", NOW.plus(Duration.ofHours(4)));
        expectGeocode("token-1");
        expectGeocode("token-1");

        client.geocode("판교역로 166");
        clock.advance(Duration.ofHours(3));
        client.geocode("판교역로 166");

        server.verify();
    }

    @Test
    @DisplayName("만료 5분 전부터는 토큰을 새로 발급받는다")
    void refreshesTokenNearExpiry() {
        expectToken("token-1", NOW.plus(Duration.ofHours(4)));
        expectGeocode("token-1");
        expectToken("token-2", NOW.plus(Duration.ofHours(8)));
        expectGeocode("token-2");

        client.geocode("판교역로 166");
        clock.advance(Duration.ofHours(4).minusMinutes(5));
        client.geocode("판교역로 166");

        server.verify();
    }

    @Test
    @DisplayName("토큰 인증 오류가 나면 한 번 새로 발급받아 다시 요청한다")
    void retriesOnceWithNewTokenWhenUnauthorized() {
        expectToken("token-1", NOW.plus(Duration.ofHours(4)));
        server.expect(requestTo(Matchers.containsString(GEOCODE)))
                .andExpect(queryParam("accessToken", "token-1"))
                .andRespond(success("{\"errCd\": -401, \"errMsg\": \"인증 정보가 존재하지 않습니다\"}"));
        expectToken("token-2", NOW.plus(Duration.ofHours(4)));
        expectGeocode("token-2");

        assertThat(client.geocode("판교역로 166")).isPresent();
        server.verify();
    }

    @Test
    @DisplayName("검색 결과가 없으면 빈 값을 반환한다")
    void returnsEmptyWhenNoResult() {
        expectToken("token-1", NOW.plus(Duration.ofHours(4)));
        server.expect(requestTo(Matchers.containsString(GEOCODE)))
                .andRespond(success("{\"errCd\": -100, \"errMsg\": \"검색결과가 존재하지 않습니다.\"}"));
        server.expect(requestTo(Matchers.containsString(REVERSE_GEOCODE)))
                .andRespond(success("{\"errCd\": -100, \"errMsg\": \"검색결과가 존재하지 않습니다.\"}"));

        assertThat(client.geocode("없는시 없는로 99999")).isEmpty();
        assertThat(client.reverseGeocode(new BigDecimal("36.0"), new BigDecimal("129.5"))).isEmpty();
    }

    @Test
    @DisplayName("값이 문자열 null이면 빈 값으로 처리한다")
    void treatsNullStringAsEmpty() {
        expectToken("token-1", NOW.plus(Duration.ofHours(4)));
        server.expect(requestTo(Matchers.containsString(GEOCODE)))
                .andRespond(success("""
                        {"errCd": 0, "result": {"resultdata": [{"x": "null", "y": "37.3954408"}]}}
                        """));

        assertThat(client.geocode("판교역로 166")).isEmpty();
    }

    @Test
    @DisplayName("토큰 발급이 실패하면 지도 공급자 오류로 변환한다")
    void convertsTokenFailureToProviderUnavailable() {
        server.expect(requestTo(Matchers.containsString(AUTH)))
                .andRespond(success("{\"errCd\": -401, \"errMsg\": \"인증정보가 존재하지 않습니다\"}"));

        assertProviderUnavailable(() -> client.geocode("판교역로 166"));
    }

    @Test
    @DisplayName("결과 없음이 아닌 오류 코드는 지도 공급자 오류로 변환한다")
    void convertsErrorCodeToProviderUnavailable() {
        expectToken("token-1", NOW.plus(Duration.ofHours(4)));
        server.expect(requestTo(Matchers.containsString(GEOCODE)))
                .andRespond(success("{\"errCd\": -200, \"errMsg\": \"시스템 오류\"}"));

        assertProviderUnavailable(() -> client.geocode("판교역로 166"));
    }

    @Test
    @DisplayName("요청이 실패하면 지도 공급자 오류로 변환한다")
    void convertsRequestFailureToProviderUnavailable() {
        expectToken("token-1", NOW.plus(Duration.ofHours(4)));
        server.expect(requestTo(Matchers.containsString(GEOCODE)))
                .andRespond(withServerError());

        assertProviderUnavailable(() -> client.geocode("판교역로 166"));
    }

    @Test
    @DisplayName("SGIS 키가 없으면 클라이언트를 만들 수 없다")
    void requiresConsumerKeys() {
        assertThatThrownBy(() -> new SgisAddressClient(" ", "secret", 2000, 5000, clock))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new SgisAddressClient("key", "", 2000, 5000, clock))
                .isInstanceOf(IllegalStateException.class);
    }

    private void expectToken(String token, Instant expiresAt) {
        server.expect(requestTo(Matchers.containsString(AUTH)))
                .andExpect(queryParam("consumer_key", "consumer-key"))
                .andExpect(queryParam("consumer_secret", "consumer-secret"))
                .andRespond(success("""
                        {"errCd": 0, "result": {"accessToken": "%s", "accessTimeout": "%d"}}
                        """.formatted(token, expiresAt.toEpochMilli())));
    }

    private void expectGeocode(String token) {
        server.expect(requestTo(Matchers.containsString(GEOCODE)))
                .andExpect(queryParam("accessToken", token))
                .andRespond(success("""
                        {"errCd": 0, "result": {"resultdata": [{"x": "127.1103669", "y": "37.3954408"}]}}
                        """));
    }

    private void assertProviderUnavailable(Runnable call) {
        assertThatThrownBy(call::run)
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getCode()).isEqualTo(DomainErrorCode.MAP_PROVIDER_UNAVAILABLE));
    }

    private static ResponseCreator success(String body) {
        return withSuccess(body, MediaType.APPLICATION_JSON);
    }

    private static String encode(String value) {
        return UriUtils.encode(value, StandardCharsets.UTF_8);
    }

    private static class MutableClock extends Clock {

        private Instant instant;

        MutableClock(Instant instant) {
            this.instant = instant;
        }

        void advance(Duration duration) {
            instant = instant.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
