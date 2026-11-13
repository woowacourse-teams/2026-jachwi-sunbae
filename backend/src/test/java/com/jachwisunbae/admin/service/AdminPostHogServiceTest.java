package com.jachwisunbae.admin.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.jachwisunbae.common.exception.JachwiException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import java.io.IOException;
import java.net.SocketTimeoutException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.http.client.MockClientHttpRequest;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class AdminPostHogServiceTest {

    private static final Instant NOW = Instant.parse("2026-11-11T04:00:00Z");
    private static final String ENDPOINT = "https://us.posthog.com/api/projects/579863/query/";
    private static final List<String> COLUMNS = List.of("eventId", "timestamp", "distinctId", "environment", "platform",
            "screenRoute", "errorCategory", "severity", "requestMethod", "requestPath", "responseStatus", "errorCode",
            "requestId", "exceptions");
    private final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();
    private final Clock clock = Clock.fixed(NOW, ZoneOffset.UTC);
    private MockRestServiceServer server;
    private RestClient client;
    private AdminPostHogService service;

    @BeforeEach
    void setUp() {
        var builder = RestClient.builder().baseUrl("https://us.posthog.com");
        server = MockRestServiceServer.bindTo(builder).build();
        client = builder.build();
        service = new AdminPostHogService(client, "test-only-private-key", clock, mapper);
    }

    @ParameterizedTest
    @CsvSource({"dev,development,1h,all,3600", "prod,production,24h,P0,86400", "dev,development,7d,P2,604800"})
    @DisplayName("실제 수집 환경과 기간·등급으로 고정 HogQL을 생성하고 최신 100건을 한 번 조회한다")
    void buildsQuery(String environment, String storedEnvironment, String period, String severity, long seconds) {
        server.expect(requestTo(ENDPOINT)).andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer test-only-private-key"))
                .andExpect(request -> {
                    var body = mapper.readTree(((MockClientHttpRequest) request).getBodyAsString());
                    assertThat(body.path("refresh").asText()).isEqualTo("force_blocking");
                    assertThat(body.path("query").path("kind").asText()).isEqualTo("HogQLQuery");
                    String query = body.path("query").path("query").asText();
                    assertThat(query).contains("event = '$exception'", "properties.$exception_list AS exceptions",
                            "properties.environment = '" + storedEnvironment + "'",
                            "timestamp >= toDateTime(" + NOW.minusSeconds(seconds).getEpochSecond() + ")",
                            "timestamp <= toDateTime(" + NOW.getEpochSecond() + ")",
                            "properties.request_id = 'request-123'", "ORDER BY timestamp DESC LIMIT 100");
                    if (severity.equals("all")) assertThat(query).doesNotContain("properties.severity =");
                    else assertThat(query).contains("properties.severity = '" + severity + "'");
                    assertThat(query).doesNotContain("SELECT *", "test-only-private-key");
                }).andRespond(withSuccess(response(mapper.createArrayNode()).toString(), MediaType.APPLICATION_JSON));

        var result = service.search(environment, period, severity, "request-123");

        assertThat(result.events()).isEmpty();
        assertThat(result.startTime()).isEqualTo(NOW.minusSeconds(seconds));
        assertThat(result.endTime()).isEqualTo(NOW);
        server.verify();
    }

    @Test
    @DisplayName("Query API의 columns·results와 예외 목록을 매핑하고 필요한 필드만 반환한다")
    void mapsEventsAndExceptionFrames() throws Exception {
        var exceptions = mapper.readTree("""
                [{"type":"TypeError","value":"parse failed","stacktrace":{"type":"raw","frames":[
                  {"filename":"https://example.com/app.js?token=private#fragment","function":"parse","lineno":12,"colno":3,
                   "vars":{"token":"private-vars"},"context_line":"private-context"}]},"mechanism":{"data":"private-mechanism"}}]
                """);
        var first = row("member-123");
        first.set(13, exceptions);
        var older = row("anonymous-id");
        older.set(1, mapper.getNodeFactory().textNode("2026-11-11 02:00:00.000"));
        older.set(13, mapper.getNodeFactory().textNode(exceptions.toString()));
        ObjectNode response = response(mapper.createArrayNode().add(older).add(first));
        response.put("hogql", "private-query");
        response.put("other", "private-raw-event");
        server.expect(requestTo(ENDPOINT)).andRespond(withSuccess(response.toString(), MediaType.APPLICATION_JSON));

        var result = service.search("dev", "24h", "P1", null);

        assertThat(result.events()).hasSize(2);
        var event = result.events().getFirst();
        assertThat(event.timestamp()).isEqualTo(Instant.parse("2026-11-11T03:00:00Z"));
        assertThat(event.memberId()).isEqualTo(123L);
        assertThat(event.distinctId()).isEqualTo("member-123");
        assertThat(event.environment()).isEqualTo("development");
        assertThat(event.platform()).isEqualTo("web");
        assertThat(event.screenRoute()).isEqualTo("/properties");
        assertThat(event.errorCategory()).isEqualTo("api");
        assertThat(event.severity()).isEqualTo("P1");
        assertThat(event.requestMethod()).isEqualTo("GET");
        assertThat(event.requestPath()).isEqualTo("/api/properties");
        assertThat(event.responseStatus()).isEqualTo(200);
        assertThat(event.errorCode()).isEqualTo("INVALID_RESPONSE");
        assertThat(event.requestId()).isEqualTo("request-123");
        assertThat(event.exceptions().getFirst().type()).isEqualTo("TypeError");
        assertThat(event.exceptions().getFirst().message()).isEqualTo("parse failed");
        var frame = event.exceptions().getFirst().frames().getFirst();
        assertThat(frame.filename()).isEqualTo("https://example.com/app.js");
        assertThat(frame.function()).isEqualTo("parse");
        assertThat(frame.line()).isEqualTo(12);
        assertThat(frame.column()).isEqualTo(3);
        assertThat(result.events().getLast().exceptions()).isEqualTo(event.exceptions());
        assertThat(result.events().getLast().memberId()).isNull();
        assertThat(mapper.writeValueAsString(result)).doesNotContain("private", "test-only", "hogql", "vars", "mechanism");
        server.verify();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"123", "anonymous-123", "member-0", "member--1", "member-01", "member-123-extra", "member-9223372036854775808"})
    @DisplayName("정확한 회원 접두사가 없는 익명·숫자 ID와 유효하지 않은 회원 ID는 추정하지 않는다")
    void leavesAnonymousMemberNull(String distinctId) {
        server.expect(requestTo(ENDPOINT)).andRespond(withSuccess(response(mapper.createArrayNode().add(row(distinctId))).toString(), MediaType.APPLICATION_JSON));
        assertThat(service.search("dev", "1h", "all", null).events().getFirst().memberId()).isNull();
    }

    @Test
    @DisplayName("과거 이벤트의 없는 속성·예외·스택은 null이며 임의로 만들지 않는다")
    void keepsMissingFieldsNull() {
        var row = mapper.createArrayNode();
        COLUMNS.forEach(column -> row.addNull());
        server.expect(requestTo(ENDPOINT)).andRespond(withSuccess(response(mapper.createArrayNode().add(row)).toString(), MediaType.APPLICATION_JSON));
        var event = service.search("dev", "1h", "all", null).events().getFirst();
        assertThat(event.memberId()).isNull();
        assertThat(event.timestamp()).isNull();
        assertThat(event.exceptions()).isNull();
        assertThat(event.requestId()).isNull();
        assertThat(event.responseStatus()).isNull();
    }

    @Test
    @DisplayName("최신순 정렬 후 최대 100건으로 제한한다")
    void limitsEvents() {
        var rows = mapper.createArrayNode();
        for (int i = 0; i < 101; i++) {
            var row = row("member-123");
            row.set(1, mapper.getNodeFactory().textNode(NOW.minusSeconds(101 - i).toString()));
            rows.add(row);
        }
        server.expect(requestTo(ENDPOINT)).andRespond(withSuccess(response(rows).toString(), MediaType.APPLICATION_JSON));
        var events = service.search("dev", "1h", "all", null).events();
        assertThat(events).hasSize(100);
        assertThat(events.getFirst().timestamp()).isEqualTo(NOW.minusSeconds(1));
        assertThat(events.getLast().timestamp()).isEqualTo(NOW.minusSeconds(100));
    }

    @ParameterizedTest
    @CsvSource({"staging,1h,all", "dev,30d,all", "dev,1h,P3", "prod,7d,'P1 OR 1=1'"})
    @DisplayName("허용하지 않은 필터는 외부 요청 없이 차단한다")
    void rejectsFilters(String environment, String period, String severity) {
        assertCode(() -> service.search(environment, period, severity, null), ErrorCode.ADMIN_POSTHOG_INPUT_INVALID);
        server.verify();
    }

    @ParameterizedTest
    @ValueSource(strings = {"", " ", "id' OR 1=1", "id\nnext", "한글", "id/other"})
    @DisplayName("요청 ID에 쿼리 구문을 넣을 수 없다")
    void rejectsRequestId(String id) {
        assertCode(() -> service.search("dev", "1h", "all", id), ErrorCode.ADMIN_POSTHOG_INPUT_INVALID);
        server.verify();
    }

    @Test
    @DisplayName("조회 키 누락은 빈 성공 응답 대신 명확한 설정 오류이며 긴 요청 ID는 거부한다")
    void rejectsMissingKeyAndLongId() {
        var unconfigured = new AdminPostHogService(client, " ", clock, mapper);
        assertCode(() -> unconfigured.search("dev", "1h", "all", null), ErrorCode.ADMIN_POSTHOG_NOT_CONFIGURED);
        assertCode(() -> service.search("dev", "1h", "all", "a".repeat(129)), ErrorCode.ADMIN_POSTHOG_INPUT_INVALID);
        server.verify();
    }

    @ParameterizedTest
    @CsvSource({"401,ADMIN_POSTHOG_AUTH_FAILED", "403,ADMIN_POSTHOG_ACCESS_DENIED", "429,ADMIN_POSTHOG_RATE_LIMITED",
            "504,ADMIN_POSTHOG_TIMEOUT", "500,ADMIN_POSTHOG_UNAVAILABLE", "302,ADMIN_POSTHOG_UNAVAILABLE"})
    @DisplayName("인증·권한·한도·시간 초과·서비스 오류를 구분하고 응답 원문을 노출하지 않는다")
    void mapsUpstreamFailure(int status, ErrorCode code) {
        server.expect(requestTo(ENDPOINT)).andRespond(withStatus(HttpStatus.valueOf(status))
                .body("private-query test-only-private-key").contentType(MediaType.APPLICATION_JSON));
        assertCode(() -> service.search("dev", "1h", "all", null), code);
        server.verify();
    }

    @Test
    @DisplayName("네트워크 시간 초과를 구분하고 자동 재시도하지 않는다")
    void handlesTimeout() {
        server.expect(requestTo(ENDPOINT)).andRespond(withException(new SocketTimeoutException("private-network")));
        assertCode(() -> service.search("dev", "1h", "all", null), ErrorCode.ADMIN_POSTHOG_TIMEOUT);
        server.verify();
    }

    @Test
    @DisplayName("연결 실패를 안전한 서비스 오류로 반환한다")
    void handlesConnectionFailure() {
        server.expect(requestTo(ENDPOINT)).andRespond(withException(new IOException("private-network")));
        assertCode(() -> service.search("dev", "1h", "all", null), ErrorCode.ADMIN_POSTHOG_UNAVAILABLE);
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"results\":[],\"columns\":[]}", "not-json",
            "{\"results\":[],\"columns\":[],\"query_status\":{\"complete\":false}}"})
    @DisplayName("완료되지 않은 조회와 잘못된 응답을 빈 조회 성공으로 반환하지 않는다")
    void rejectsInvalidResponse(String body) {
        server.expect(requestTo(ENDPOINT)).andRespond(withSuccess(body, MediaType.APPLICATION_JSON));
        assertCode(() -> service.search("dev", "1h", "all", null), ErrorCode.ADMIN_POSTHOG_UNAVAILABLE);
    }

    private ObjectNode response(ArrayNode rows) {
        var response = mapper.createObjectNode();
        response.set("columns", mapper.valueToTree(COLUMNS));
        response.set("results", rows);
        return response;
    }

    private ArrayNode row(String distinctId) {
        return mapper.createArrayNode().add("event-id").add("2026-11-11T03:00:00Z").add(distinctId)
                .add("development").add("web").add("/properties").add("api").add("P1").add("GET")
                .add("/api/properties").add(200).add("INVALID_RESPONSE").add("request-123").addNull();
    }

    private void assertCode(Runnable action, ErrorCode code) {
        assertThatThrownBy(action::run).isInstanceOf(JachwiException.class).satisfies(error -> {
            assertThat(((JachwiException) error).getErrorCode()).isEqualTo(code);
            assertThat(error.getMessage()).doesNotContain("test-only", "private-query", "private-network");
            assertThat(error.getCause()).isNull();
        });
    }
}
