package com.jachwisunbae.map.provider.tago;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import com.jachwisunbae.map.domain.NearbyPlace;
import java.math.BigDecimal;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class TagoBusStopProviderTest {

    private static final String NEARBY_STOPS = "/1613000/BusSttnInfoInqireService/getCrdntPrxmtSttnList";
    private static final BigDecimal LATITUDE = new BigDecimal("37.406");
    private static final BigDecimal LONGITUDE = new BigDecimal("127.088");

    private MockRestServiceServer server;
    private TagoBusStopProvider provider;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://apis.data.go.kr");
        server = MockRestServiceServer.bindTo(builder).build();
        provider = new TagoBusStopProvider(builder.build(), "service-key");
    }

    @Test
    @DisplayName("반경 안의 버스정류장을 주변 시설로 변환한다")
    void convertsBusStopsWithinRadius() {
        server.expect(requestTo(Matchers.containsString(NEARBY_STOPS)))
                .andRespond(withSuccess("""
                        {"response": {"header": {"resultCode": "00"}, "body": {"items": {"item": [
                          {"citycode": 31020, "gpslati": 37.4064167, "gpslong": 127.0882833,
                           "nodeid": "GGB204000159", "nodenm": "벤처타운(북문)"}
                        ]}}}}
                        """, MediaType.APPLICATION_JSON));

        assertThat(provider.nearby(LATITUDE, LONGITUDE, 500))
                .extracting(NearbyPlace::providerPlaceId, NearbyPlace::name)
                .containsExactly(tuple("tago:31020:GGB204000159", "벤처타운(북문)"));
    }

    @Test
    @DisplayName("정류장 좌표 형식이 잘못되면 숫자 변환 오류가 아니라 지도 공급자 오류로 변환한다")
    void convertsMalformedCoordinateToProviderUnavailable() {
        server.expect(requestTo(Matchers.containsString(NEARBY_STOPS)))
                .andRespond(withSuccess("""
                        {"response": {"header": {"resultCode": "00"}, "body": {"items": {"item":
                          {"citycode": 31020, "gpslati": "위도", "gpslong": 127.0882833, "nodeid": "N1"}
                        }}}}
                        """, MediaType.APPLICATION_JSON));

        assertProviderUnavailable();
    }

    @Test
    @DisplayName("요청이 실패하면 지도 공급자 오류로 변환한다")
    void convertsRequestFailureToProviderUnavailable() {
        server.expect(requestTo(Matchers.containsString(NEARBY_STOPS))).andRespond(withServerError());

        assertProviderUnavailable();
    }

    private void assertProviderUnavailable() {
        assertThatThrownBy(() -> provider.nearby(LATITUDE, LONGITUDE, 500))
                .isInstanceOfSatisfying(UpstreamServiceException.class, exception ->
                        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.MAP_PROVIDER_UNAVAILABLE));
    }
}
