package com.jachwisunbae.map.provider.publicdata;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.queryParam;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import java.nio.charset.StandardCharsets;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriUtils;

class JusoAddressClientTest {

    private MockRestServiceServer server;
    private JusoAddressClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://business.juso.go.kr");
        server = MockRestServiceServer.bindTo(builder).build();
        client = new JusoAddressClient(builder.build(), "test-key");
    }

    @Test
    @DisplayName("검색어로 주소 후보 5개를 요청하고 도로명주소와 지번 주소로 변환한다")
    void searchesAddressesAndParsesResponse() {
        server.expect(requestTo(Matchers.containsString("/addrlink/addrLinkApi.do")))
                .andExpect(queryParam("confmKey", "test-key"))
                .andExpect(queryParam("currentPage", "1"))
                .andExpect(queryParam("countPerPage", "5"))
                .andExpect(queryParam("keyword", UriUtils.encode("판교역로 166", StandardCharsets.UTF_8)))
                .andExpect(queryParam("resultType", "json"))
                .andRespond(withSuccess(response("0", "정상", """
                        [{
                          "roadAddr": "경기도 성남시 분당구 판교역로 166 (백현동)",
                          "roadAddrPart1": "경기도 성남시 분당구 판교역로 166",
                          "jibunAddr": "경기도 성남시 분당구 백현동 532 카카오 판교 아지트"
                        }]
                        """), MediaType.APPLICATION_JSON));

        JusoAddressSearchResponse response = client.search("판교역로 166");

        assertThat(response.addresses()).containsExactly(new JusoAddressSearchResponse.Address(
                "경기도 성남시 분당구 판교역로 166", "경기도 성남시 분당구 백현동 532 카카오 판교 아지트"));
        server.verify();
    }

    @Test
    @DisplayName("검색 결과가 없으면 빈 목록을 반환한다")
    void returnsEmptyWhenNothingFound() {
        server.expect(requestTo(Matchers.containsString("/addrlink/addrLinkApi.do")))
                .andRespond(withSuccess(response("0", "정상", "[]"), MediaType.APPLICATION_JSON));

        assertThat(client.search("없는도로명12345").addresses()).isEmpty();
    }

    @Test
    @DisplayName("검색어 형식 오류는 사용자 입력 문제라 빈 목록을 반환한다")
    void returnsEmptyWhenKeywordIsInvalid() {
        server.expect(requestTo(Matchers.containsString("/addrlink/addrLinkApi.do")))
                .andRespond(withSuccess(response("E0008", "검색어는 두글자 이상 입력되어야 합니다.", "null"),
                        MediaType.APPLICATION_JSON));

        assertThat(client.search("판").addresses()).isEmpty();
    }

    @Test
    @DisplayName("승인키 오류처럼 입력 문제가 아닌 오류 코드는 지도 공급자 오류로 변환한다")
    void convertsApiErrorCodeToProviderUnavailable() {
        server.expect(requestTo(Matchers.containsString("/addrlink/addrLinkApi.do")))
                .andRespond(withSuccess(response("E0001", "승인되지 않은 KEY 입니다.", "null"),
                        MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.search("판교역로 166"))
                .isInstanceOfSatisfying(BusinessException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(DomainErrorCode.MAP_PROVIDER_UNAVAILABLE);
                    assertThat(exception.getMessage()).contains("E0001");
                });
    }

    @Test
    @DisplayName("검색어에 너무 긴 숫자가 들어 있는 오류도 사용자 입력 문제라 빈 목록을 반환한다")
    void returnsEmptyWhenKeywordHasTooLongNumber() {
        server.expect(requestTo(Matchers.containsString("/addrlink/addrLinkApi.do")))
                .andRespond(withSuccess(response("E0011", "검색어에 너무 긴 숫자가 포함되어 있습니다.", "null"),
                        MediaType.APPLICATION_JSON));

        assertThat(client.search("판교역로 12345678901").addresses()).isEmpty();
    }

    @Test
    @DisplayName("개발용 승인키가 만료되면 지도 공급자 오류로 변환한다")
    void convertsExpiredKeyToProviderUnavailable() {
        server.expect(requestTo(Matchers.containsString("/addrlink/addrLinkApi.do")))
                .andRespond(withSuccess(response("E0014", "개발승인키 기간이 만료되어 서비스를 이용하실 수 없습니다.", "null"),
                        MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.search("판교역로 166"))
                .isInstanceOfSatisfying(BusinessException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(DomainErrorCode.MAP_PROVIDER_UNAVAILABLE);
                    assertThat(exception.getMessage()).contains("E0014");
                });
    }

    @Test
    @DisplayName("알 수 없는 오류 코드는 지도 공급자 오류로 변환한다")
    void convertsUnknownErrorCodeToProviderUnavailable() {
        server.expect(requestTo(Matchers.containsString("/addrlink/addrLinkApi.do")))
                .andRespond(withSuccess(response("E9999", "새로운 오류", "null"), MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.search("판교역로 166"))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getCode()).isEqualTo(DomainErrorCode.MAP_PROVIDER_UNAVAILABLE));
    }

    @Test
    @DisplayName("요청이 실패하면 지도 공급자 오류로 변환한다")
    void convertsRequestFailureToProviderUnavailable() {
        server.expect(requestTo(Matchers.containsString("/addrlink/addrLinkApi.do")))
                .andRespond(withServerError());

        assertThatThrownBy(() -> client.search("판교역로 166"))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getCode()).isEqualTo(DomainErrorCode.MAP_PROVIDER_UNAVAILABLE));
    }

    @Test
    @DisplayName("승인키가 없으면 클라이언트를 만들 수 없다")
    void requiresConfirmKey() {
        assertThatThrownBy(() -> new JusoAddressClient(" ", 2000, 5000))
                .isInstanceOf(IllegalStateException.class);
    }

    private String response(String errorCode, String errorMessage, String juso) {
        return """
                {"results": {"common": {"errorCode": "%s", "errorMessage": "%s"}, "juso": %s}}
                """.formatted(errorCode, errorMessage, juso);
    }
}
