package com.jachwisunbae.promotion.provider.seveneleven;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import java.net.SocketTimeoutException;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

@ExtendWith(OutputCaptureExtension.class)
class SevenElevenPromotionClientTest {

    private static final String FIRST_URL = SevenElevenPromotionClient.BASE_URL + SevenElevenPromotionClient.FIRST_PATH;
    private static final String MORE_URL = SevenElevenPromotionClient.BASE_URL + SevenElevenPromotionClient.MORE_PATH;

    private MockRestServiceServer server;
    private SevenElevenPromotionClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl(SevenElevenPromotionClient.BASE_URL);
        server = MockRestServiceServer.bindTo(builder).build();
        client = new SevenElevenPromotionClient(builder.build());
    }

    @AfterEach
    void verifyRequests() {
        server.verify();
    }

    @Test
    @DisplayName("첫 화면은 탭만, 더보기는 페이지와 빈 분류 필터를 form으로 POST하고 요청 사이 최소 1초를 기다린다")
    void postsFirstAndMoreForms() {
        AtomicLong secondRequestAt = new AtomicLong();
        server.expect(requestTo(FIRST_URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andExpect(header(HttpHeaders.ACCEPT, MediaType.TEXT_HTML_VALUE))
                .andExpect(content().string("pTab=1"))
                .andRespond(withSuccess("첫 화면", MediaType.TEXT_HTML));
        server.expect(requestTo(MORE_URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().string("intPageSize=10&intCurrPage=2&cateCd1=&cateCd2=&cateCd3=&pTab=4"))
                .andRespond(request -> {
                    secondRequestAt.set(System.nanoTime());
                    return withSuccess("더보기", MediaType.TEXT_HTML).createResponse(request);
                });

        assertThat(client.fetchFirst(SevenElevenPromotionTab.ONE_PLUS_ONE)).isEqualTo("첫 화면");
        long firstResponseAt = System.nanoTime();
        assertThat(client.fetchMore(SevenElevenPromotionTab.SALE, 2)).isEqualTo("더보기");

        assertThat(secondRequestAt.get() - firstResponseAt).isGreaterThanOrEqualTo(Duration.ofSeconds(1).toNanos());
    }

    @ParameterizedTest
    @ValueSource(ints = {204, 301, 302, 403, 429, 500, 503})
    @DisplayName("접근 제한·리다이렉트를 포함한 200 외의 상태에서 재시도 없이 실패하고 상태를 기록한다")
    void rejectsHttpErrors(final int status, final CapturedOutput output) {
        server.expect(requestTo(FIRST_URL)).andRespond(withStatus(HttpStatusCode.valueOf(status)));

        assertThatThrownBy(() -> client.fetchFirst(SevenElevenPromotionTab.ONE_PLUS_ONE))
                .isInstanceOfSatisfying(UpstreamServiceException.class, exception -> {
                    assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.PROMOTION_PROVIDER_UNAVAILABLE);
                    assertThat(exception).hasMessageContaining("HTTP status=" + status, "tab=ONE_PLUS_ONE", "page=1");
                });
        assertThat(output).contains("promotion-seven-eleven-request-failed", "httpStatus=\"" + status + "\"");
    }

    @Test
    @DisplayName("네트워크 시간 초과를 외부 시스템 실패로 전달하고 원본 메시지는 기록하지 않는다")
    void rejectsNetworkFailure(final CapturedOutput output) {
        SocketTimeoutException cause = new SocketTimeoutException("read timeout");
        server.expect(requestTo(MORE_URL)).andRespond(withException(cause));

        assertThatThrownBy(() -> client.fetchMore(SevenElevenPromotionTab.TWO_PLUS_ONE, 3))
                .isInstanceOfSatisfying(UpstreamServiceException.class, exception -> {
                    assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.PROMOTION_PROVIDER_UNAVAILABLE);
                    assertThat(exception.getCause()).hasCause(cause);
                });
        assertThat(output).contains("promotion-seven-eleven-request-failed", "tab=\"TWO_PLUS_ONE\"", "page=\"3\"")
                .doesNotContain("read timeout");
    }

    @Test
    @DisplayName("더보기는 2페이지 미만이면 요청하지 않는다")
    void rejectsFirstPageAsMore() {
        assertThatThrownBy(() -> client.fetchMore(SevenElevenPromotionTab.ONE_PLUS_ONE, 1))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("대기 중 인터럽트가 발생하면 상태를 복원하고 다음 요청을 보내지 않는다")
    void stopsOnInterruption() {
        server.expect(requestTo(FIRST_URL)).andRespond(withSuccess("첫 화면", MediaType.TEXT_HTML));
        client.fetchFirst(SevenElevenPromotionTab.ONE_PLUS_ONE);

        Thread.currentThread().interrupt();
        try {
            assertThatThrownBy(() -> client.fetchFirst(SevenElevenPromotionTab.SALE))
                    .isInstanceOf(IllegalStateException.class)
                    .hasCauseInstanceOf(InterruptedException.class);
            assertThat(Thread.currentThread().isInterrupted()).isTrue();
        } finally {
            Thread.interrupted();
        }
    }
}
