package com.jachwisunbae.promotion.provider.seveneleven;

import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.SocketTimeoutException;
import java.net.http.HttpClient;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
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
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;


@ExtendWith(OutputCaptureExtension.class)
class SevenElevenPromotionClientTest {

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
    void postsFirstTabAndThenObservedMoreFormWithOneSecondGap(final CapturedOutput output) {
        AtomicLong secondAt = new AtomicLong();
        server.expect(requestTo(SevenElevenPromotionClient.SOURCE_URL)).andExpect(method(HttpMethod.POST))
                .andExpect(content().string("pTab=1")).andRespond(withSuccess("first", MediaType.TEXT_HTML));
        server.expect(requestTo(SevenElevenPromotionClient.BASE_URL + "/product/listMoreAjax.asp"))
                .andExpect(method(HttpMethod.POST)).andExpect(content().contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andExpect(header(HttpHeaders.ACCEPT, MediaType.TEXT_HTML_VALUE))
                .andExpect(content().string("intPageSize=10&intCurrPage=2&cateCd1=&cateCd2=&cateCd3=&pTab=4"))
                .andRespond(request -> {
                    secondAt.set(System.nanoTime());
                    return withSuccess("다음", MediaType.TEXT_HTML).createResponse(request);
                });
        assertThat(client.fetchFirst(SevenElevenPromotionTab.ONE_PLUS_ONE)).isEqualTo("first");
        long firstAt = System.nanoTime();
        assertThat(client.fetchMore(SevenElevenPromotionTab.SALE, 2)).isEqualTo("다음");
        assertThat(secondAt.get() - firstAt).isGreaterThanOrEqualTo(Duration.ofSeconds(1).toNanos());
        assertThat(output).contains("tab=SALE page=2 status=200 success=true", "waitMillis=", "httpElapsedMillis=")
                .doesNotContain("다음");
    }

    @ParameterizedTest
    @ValueSource(ints = {204, 301, 302, 403, 429, 500, 503})
    void stopsOnNon200WithoutRetry(final int status) {
        server.expect(requestTo(SevenElevenPromotionClient.SOURCE_URL))
                .andRespond(withStatus(HttpStatusCode.valueOf(status)));
        assertThatThrownBy(() -> client.fetchFirst(SevenElevenPromotionTab.ONE_PLUS_ONE))
                .isInstanceOf(UpstreamServiceException.class).hasMessageContaining("HTTP status=" + status);
    }

    @Test
    void propagatesTimeout(final CapturedOutput output) {
        server.expect(requestTo(SevenElevenPromotionClient.SOURCE_URL))
                .andRespond(withException(new SocketTimeoutException("read timeout")));
        assertThatThrownBy(() -> client.fetchFirst(SevenElevenPromotionTab.ONE_PLUS_ONE))
                .isInstanceOf(UpstreamServiceException.class).hasMessageContaining("tab=ONE_PLUS_ONE", "page=1");
        assertThat(output).contains("tab=ONE_PLUS_ONE page=1 success=false", "httpElapsedMillis=",
                "causeType=SocketTimeoutException");
    }

    @Test
    void rejectsFirstPageAsMoreBeforeRequest() {
        assertThatThrownBy(() -> client.fetchMore(SevenElevenPromotionTab.ONE_PLUS_ONE, 1))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void preservesInterruptionAndDoesNotSendSecondRequest() {
        server.expect(requestTo(SevenElevenPromotionClient.SOURCE_URL)).andRespond(withSuccess("first", MediaType.TEXT_HTML));
        client.fetchFirst(SevenElevenPromotionTab.ONE_PLUS_ONE);
        Thread.currentThread().interrupt();
        try {
            assertThatThrownBy(() -> client.fetchFirst(SevenElevenPromotionTab.SALE))
                    .isInstanceOf(IllegalStateException.class).hasCauseInstanceOf(InterruptedException.class);
            assertThat(Thread.currentThread().isInterrupted()).isTrue();
        } finally {
            Thread.interrupted();
        }
    }

    @Test
    void timesOutWaitingForLocalHttpResponseWithoutRetry(final CapturedOutput output) throws Exception {
        CountDownLatch entered = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        AtomicInteger requests = new AtomicInteger();
        HttpServer local = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        local.createContext("/product/presentList.asp", exchange -> {
            requests.incrementAndGet();
            entered.countDown();
            try {
                release.await(5, TimeUnit.SECONDS);
                exchange.sendResponseHeaders(200, -1);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
            } finally {
                exchange.close();
            }
        });
        local.start();
        try {
            JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(HttpClient.newHttpClient());
            factory.setReadTimeout(Duration.ofMillis(200));
            SevenElevenPromotionClient delayed = new SevenElevenPromotionClient(RestClient.builder()
                    .baseUrl("http://127.0.0.1:" + local.getAddress().getPort()).requestFactory(factory).build());

            assertThatThrownBy(() -> delayed.fetchFirst(SevenElevenPromotionTab.ONE_PLUS_ONE))
                    .isInstanceOf(UpstreamServiceException.class).hasRootCauseInstanceOf(HttpTimeoutException.class);

            assertThat(entered.await(1, TimeUnit.SECONDS)).isTrue();
            assertThat(requests).hasValue(1);
            assertThat(output).contains("tab=ONE_PLUS_ONE page=1 success=false", "causeType=HttpTimeoutException");
        } finally {
            release.countDown();
            local.stop(0);
        }
    }
}
