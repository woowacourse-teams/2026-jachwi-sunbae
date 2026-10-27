package com.jachwisunbae.weather.provider.kma;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.queryParam;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import com.jachwisunbae.weather.domain.ForecastTimes;
import com.jachwisunbae.weather.domain.WeatherElement;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.http.HttpTimeoutException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Stream;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EmptySource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.http.client.MockClientHttpResponse;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

class KmaForecastClientTest {

    private static final String URL = "https://apihub.kma.go.kr/api/typ01/cgi-bin/url/nph-dfs_shrt_grd";
    private static final String API_KEY = "test-secret-key";
    private static final String PRIVATE_BODY = "provider-private-response-body";
    private static final ForecastTimes TIMES = new ForecastTimes(LocalDateTime.of(2026, 10, 22, 23, 0),
            LocalDateTime.of(2026, 10, 23, 0, 0));

    private MockRestServiceServer server;
    private RestClient restClient;
    private KmaForecastClient client;
    private Logger logger;
    private ListAppender<ILoggingEvent> appender;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://apihub.kma.go.kr");
        server = MockRestServiceServer.bindTo(builder).build();
        restClient = builder.build();
        client = new KmaForecastClient(restClient, API_KEY);
        logger = (Logger) LoggerFactory.getLogger(KmaForecastClient.class);
        appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
    }

    @AfterEach
    void verifyRequests() {
        try {
            server.verify();
            for (ILoggingEvent event : appender.list) {
                assertThat(event.getFormattedMessage() + event.getKeyValuePairs())
                        .doesNotContain(API_KEY, "authKey", "https://", PRIVATE_BODY);
                assertThat(event.getThrowableProxy()).isNull();
            }
        } finally {
            logger.detachAppender(appender);
            appender.stop();
        }
    }

    @ParameterizedTest
    @EnumSource(WeatherElement.class)
    @DisplayName("요청한 시각·요소·인증키로 전국 격자자료를 받아 검증된 예보를 반환한다")
    void fetchesRequestedForecast(final WeatherElement element) {
        server.expect(requestTo(Matchers.startsWith(URL + "?")))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header(HttpHeaders.ACCEPT, MediaType.TEXT_PLAIN_VALUE))
                .andExpect(queryParam("tmfc", "2026102223"))
                .andExpect(queryParam("tmef", "2026102300"))
                .andExpect(queryParam("vars", element.name()))
                .andExpect(queryParam("authKey", API_KEY))
                .andRespond(withSuccess(validRaw(), MediaType.TEXT_PLAIN));

        GridForecast result = client.fetch(new KmaForecastRequest(TIMES, element));

        assertThat(result.times()).isEqualTo(TIMES);
        assertThat(result.element()).isEqualTo(element);
        assertThat(result.values()[0]).isZero();
        assertThat(result.values()[18833]).isEqualTo(1.0);
        assertThat(result.validCount()).isEqualTo(2);
        assertThat(result.missingCount()).isEqualTo(37695);
        assertThat(appender.list).isEmpty();
    }

    @Test
    @DisplayName("인증키의 예약 문자를 인코딩해 쿼리 파라미터가 변형되지 않는다")
    void encodesApiKeyAsUriVariable() {
        server.expect(requestTo(URL + "?tmfc=2026102223&tmef=2026102300&vars=TMP"
                        + "&authKey=test%2Bkey%2F%3D%26%3F%25"))
                .andRespond(withSuccess(validRaw(), MediaType.TEXT_PLAIN));

        GridForecast result = new KmaForecastClient(restClient, "test+key/=&?%")
                .fetch(new KmaForecastRequest(TIMES, WeatherElement.TMP));

        assertThat(result.validCount()).isEqualTo(2);
    }

    @ParameterizedTest
    @ValueSource(ints = {204, 206, 301, 302, 401, 403, 429, 500, 503})
    @DisplayName("200 이외의 상태는 본문·URL을 노출하지 않고 HTTP 상태로 실패를 구분한다")
    void rejectsNonOkStatus(final int status) {
        server.expect(requestTo(Matchers.startsWith(URL)))
                .andRespond(withStatus(HttpStatus.valueOf(status)).body(PRIVATE_BODY + " authKey=" + API_KEY)
                        .header(HttpHeaders.LOCATION, "https://example.com/?authKey=" + API_KEY));

        assertThatThrownBy(() -> client.fetch(new KmaForecastRequest(TIMES, WeatherElement.TMP)))
                .isInstanceOfSatisfying(UpstreamServiceException.class, exception -> {
                    assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.WEATHER_PROVIDER_UNAVAILABLE);
                    assertThat(exception).hasMessageContaining("HTTP status=" + status);
                    assertSecretIsAbsent(exception);
                });
        assertFailureLog(new KmaForecastRequest(TIMES, WeatherElement.TMP), ErrorCode.WEATHER_PROVIDER_UNAVAILABLE, status);
    }

    @ParameterizedTest
    @EmptySource
    @ValueSource(strings = {" ", "<html>authKey=test-secret-key</html>",
            "{\"error\":\"authKey=test-secret-key\"}", "provider-private-response-body", "1,2,3,"})
    @DisplayName("HTTP 200이어도 빈 본문·오류 본문·불완전한 격자자료는 거부한다")
    void rejectsInvalidOkResponse(final String body) {
        server.expect(requestTo(Matchers.startsWith(URL)))
                .andRespond(withSuccess(body, MediaType.TEXT_PLAIN));

        assertThatThrownBy(() -> client.fetch(new KmaForecastRequest(TIMES, WeatherElement.TMP)))
                .isInstanceOfSatisfying(UpstreamServiceException.class, exception -> {
                    assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.WEATHER_RESPONSE_INVALID);
                    assertSecretIsAbsent(exception);
                });
        assertFailureLog(new KmaForecastRequest(TIMES, WeatherElement.TMP), ErrorCode.WEATHER_RESPONSE_INVALID, 200);
    }

    @ParameterizedTest
    @MethodSource("networkFailures")
    @DisplayName("연결 오류와 시간 초과는 HTTP 상태 오류와 구분하며 원본 예외의 인증키를 숨긴다")
    void rejectsNetworkFailure(final IOException failure) {
        server.expect(requestTo(Matchers.startsWith(URL))).andRespond(withException(failure));

        assertNetworkFailure();
        assertFailureLog(new KmaForecastRequest(TIMES, WeatherElement.TMP), ErrorCode.WEATHER_PROVIDER_UNAVAILABLE, null);
    }

    @Test
    @DisplayName("HTTP 200의 본문을 읽던 중 실패해도 부분 자료를 반환하지 않는다")
    void rejectsFailureWhileReadingBody() {
        server.expect(requestTo(Matchers.startsWith(URL))).andRespond(request ->
                new MockClientHttpResponse(new InputStream() {
                    @Override
                    public int read() throws IOException {
                        try {
                            Thread.sleep(30);
                        } catch (InterruptedException exception) {
                            Thread.currentThread().interrupt();
                            throw new IOException("test interrupted");
                        }
                        throw new SocketTimeoutException("authKey=" + API_KEY);
                    }
                }, HttpStatus.OK));

        assertNetworkFailure();
        Map<String, Object> fields = assertFailureLog(new KmaForecastRequest(TIMES, WeatherElement.TMP),
                ErrorCode.WEATHER_PROVIDER_UNAVAILABLE, 200);
        assertThat((Long) fields.get("durationMs")).isGreaterThanOrEqualTo(30);
    }

    @Test
    @DisplayName("기타 응답 수신 오류도 원본 예외를 숨기고 상태 미확인 로그를 한 번 남긴다")
    void logsRestClientFailureWithoutItsUnsafeMessage() {
        server.expect(requestTo(Matchers.startsWith(URL))).andRespond(request -> {
            throw new RestClientException(URL + "?authKey=" + API_KEY + PRIVATE_BODY);
        });

        assertThatThrownBy(() -> client.fetch(new KmaForecastRequest(TIMES, WeatherElement.TMP)))
                .isInstanceOfSatisfying(UpstreamServiceException.class, exception -> {
                    assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.WEATHER_PROVIDER_UNAVAILABLE);
                    assertSecretIsAbsent(exception);
                });
        assertFailureLog(new KmaForecastRequest(TIMES, WeatherElement.TMP), ErrorCode.WEATHER_PROVIDER_UNAVAILABLE, null);
    }

    @Test
    @DisplayName("앞선 요청이 성공해도 실패 로그에는 해당 일별 요청의 시각과 요소만 기록한다")
    void recordsTheFailedRequestsTimesAndElement() {
        server.expect(queryParam("vars", "TMP")).andRespond(withSuccess(validRaw(), MediaType.TEXT_PLAIN));
        ForecastTimes dailyTimes = new ForecastTimes(TIMES.publishedAt().plusHours(3), TIMES.forecastAt().plusHours(15));
        KmaForecastRequest dailyRequest = new KmaForecastRequest(dailyTimes, WeatherElement.TMX);
        server.expect(queryParam("vars", "TMX")).andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));

        client.fetch(new KmaForecastRequest(TIMES, WeatherElement.TMP));
        assertThat(appender.list).isEmpty();
        assertThatThrownBy(() -> client.fetch(dailyRequest)).isInstanceOf(UpstreamServiceException.class);

        assertFailureLog(dailyRequest, ErrorCode.WEATHER_PROVIDER_UNAVAILABLE, 503);
    }

    @Test
    @DisplayName("격자 개수는 맞지만 숫자 대신 비밀정보가 들어온 경우에도 로그와 예외에 원문을 남기지 않는다")
    void doesNotLogInvalidRawToken() {
        String body = PRIVATE_BODY + " authKey=" + API_KEY + validRaw().substring("0.00".length());
        server.expect(requestTo(Matchers.startsWith(URL))).andRespond(withSuccess(body, MediaType.TEXT_PLAIN));

        assertThatThrownBy(() -> client.fetch(new KmaForecastRequest(TIMES, WeatherElement.TMP)))
                .isInstanceOfSatisfying(UpstreamServiceException.class, this::assertSecretIsAbsent);

        assertFailureLog(new KmaForecastRequest(TIMES, WeatherElement.TMP), ErrorCode.WEATHER_RESPONSE_INVALID, 200);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "\t"})
    @DisplayName("인증키 없이 생성할 수 있지만 실제 요청은 네트워크 호출 전에 거부한다")
    void requiresApiKeyOnlyWhenFetching(final String apiKey) {
        KmaForecastClient clientWithoutKey = new KmaForecastClient(restClient, apiKey);

        assertThatThrownBy(() -> clientWithoutKey.fetch(new KmaForecastRequest(TIMES, WeatherElement.TMP)))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("KMA_API_KEY가 필요합니다");
        assertThat(appender.list).isEmpty();
    }

    private Map<String, Object> assertFailureLog(final KmaForecastRequest request, final ErrorCode errorCode,
                                               final Integer httpStatus) {
        assertThat(appender.list).hasSize(1);
        ILoggingEvent event = appender.list.getFirst();
        assertThat(event.getLevel()).isEqualTo(Level.WARN);
        assertThat(event.getFormattedMessage()).isEqualTo("weather-kma-request-failed");
        assertThat(event.getKeyValuePairs()).hasSize(6);
        Map<String, Object> fields = new HashMap<>();
        event.getKeyValuePairs().forEach(pair -> fields.put(pair.key, pair.value));
        assertThat(fields).containsOnlyKeys("publishedAt", "forecastAt", "element", "errorCode", "httpStatus", "durationMs")
                .containsEntry("publishedAt", request.times().publishedAt() + "+09:00")
                .containsEntry("forecastAt", request.times().forecastAt() + "+09:00")
                .containsEntry("element", request.element().name())
                .containsEntry("errorCode", errorCode.name())
                .containsEntry("httpStatus", httpStatus);
        assertThat(fields.get("durationMs")).isInstanceOf(Long.class);
        assertThat((Long) fields.get("durationMs")).isNotNegative();
        return fields;
    }

    private void assertNetworkFailure() {
        assertThatThrownBy(() -> client.fetch(new KmaForecastRequest(TIMES, WeatherElement.TMP)))
                .isInstanceOfSatisfying(UpstreamServiceException.class, exception -> {
                    assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.WEATHER_PROVIDER_UNAVAILABLE);
                    assertThat(exception).hasMessageContaining("네트워크 오류 또는 시간 초과");
                    assertSecretIsAbsent(exception);
                });
    }

    private void assertSecretIsAbsent(final Throwable exception) {
        StringWriter stackTrace = new StringWriter();
        exception.printStackTrace(new PrintWriter(stackTrace));
        assertThat(stackTrace.toString()).doesNotContain(API_KEY, "authKey=", "https://", PRIVATE_BODY);
        assertThat(exception).hasNoCause();
    }

    private static Stream<IOException> networkFailures() {
        String unsafeMessage = URL + "?authKey=" + API_KEY;
        return Stream.of(new ConnectException(unsafeMessage), new SocketTimeoutException(unsafeMessage),
                new HttpTimeoutException(unsafeMessage));
    }

    private String validRaw() {
        String[] values = new String[149 * 253];
        Arrays.fill(values, "-99.00");
        values[0] = "0.00";
        values[1] = "-999.00";
        values[18833] = "1.00";
        return String.join(",", values) + ",\n";
    }

}
