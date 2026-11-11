package com.jachwisunbae.admin.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jachwisunbae.common.exception.JachwiException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.scheduling.TaskScheduler;
import software.amazon.awssdk.awscore.exception.AwsErrorDetails;
import software.amazon.awssdk.core.exception.ApiCallTimeoutException;
import software.amazon.awssdk.services.cloudwatchlogs.CloudWatchLogsClient;
import software.amazon.awssdk.services.cloudwatchlogs.model.CloudWatchLogsException;
import software.amazon.awssdk.services.cloudwatchlogs.model.GetQueryResultsRequest;
import software.amazon.awssdk.services.cloudwatchlogs.model.GetQueryResultsResponse;
import software.amazon.awssdk.services.cloudwatchlogs.model.ResultField;
import software.amazon.awssdk.services.cloudwatchlogs.model.StartQueryRequest;
import software.amazon.awssdk.services.cloudwatchlogs.model.StartQueryResponse;
import software.amazon.awssdk.services.cloudwatchlogs.model.StopQueryRequest;

class AdminLogServiceTest {

    private static final Instant NOW = Instant.parse("2026-11-11T04:00:00Z");
    private final CloudWatchLogsClient client = mock(CloudWatchLogsClient.class);
    private final TaskScheduler scheduler = mock(TaskScheduler.class);
    private final Clock clock = mock(Clock.class);
    private AdminLogService service;

    @BeforeEach
    void setUp() {
        when(clock.instant()).thenReturn(NOW);
        when(clock.getZone()).thenReturn(ZoneOffset.UTC);
        when(client.startQuery(any(StartQueryRequest.class)))
                .thenReturn(StartQueryResponse.builder().queryId("aws-private-id").build());
        service = new AdminLogService(client, clock, scheduler);
    }

    @ParameterizedTest
    @CsvSource({"dev,1h,all,3600,status >= 400 and status < 600",
            "prod,24h,4xx,86400,status >= 400 and status < 500",
            "dev,7d,5xx,604800,status >= 500 and status < 600"})
    @DisplayName("허용한 환경·기간·상태만 서버 쿼리로 변환하고 최신 100건으로 제한한다")
    void selectsGroupAndFilters(String environment, String period, String status, long seconds, String filter) {
        var result = service.start(environment, period, status, null);

        var request = ArgumentCaptor.forClass(StartQueryRequest.class);
        verify(client).startQuery(request.capture());
        assertThat(request.getValue().logGroupName()).isEqualTo("/jachwi-sunbae/" + environment + "/application");
        assertThat(request.getValue().startTime()).isEqualTo(NOW.minusSeconds(seconds).getEpochSecond());
        assertThat(request.getValue().endTime()).isEqualTo(NOW.getEpochSecond());
        assertThat(request.getValue().limit()).isEqualTo(100);
        assertThat(request.getValue().queryString()).contains(filter, "member_id", "sort @timestamp desc", "limit 100")
                .doesNotContain("request_body", "@message", "query_string", "stack_trace");
        assertThat(result.queryId()).isNotEqualTo("aws-private-id");
        assertThat(result.status()).isEqualTo("Scheduled");
        assertThat(result.logs()).isNull();
    }

    @ParameterizedTest
    @CsvSource({"staging,1h,all", "dev,30d,all", "dev,1h,200", "/other/group,1h,all"})
    @DisplayName("지원하지 않는 환경·기간·상태는 AWS 호출 전에 거부한다")
    void rejectsInvalidFilters(String environment, String period, String status) {
        assertCode(() -> service.start(environment, period, status, null), ErrorCode.ADMIN_LOG_INPUT_INVALID);
        verifyNoInteractions(client);
    }

    @ParameterizedTest
    @ValueSource(strings = {"", " ", "id' | limit 10000", "id\nnext", "한글", "id/other"})
    @DisplayName("요청 ID로 쿼리 구문을 주입할 수 없다")
    void rejectsInvalidRequestIds(String requestId) {
        assertCode(() -> service.start("dev", "1h", "all", requestId), ErrorCode.ADMIN_LOG_INPUT_INVALID);
        verifyNoInteractions(client);
    }

    @Test
    @DisplayName("지나치게 긴 요청 ID는 조회하지 않는다")
    void rejectsLongRequestId() {
        assertCode(() -> service.start("dev", "1h", "all", "a".repeat(129)), ErrorCode.ADMIN_LOG_INPUT_INVALID);
        verifyNoInteractions(client);
    }

    @Test
    @DisplayName("요청 상세는 HTTP 200을 포함하고 시간순으로 예외 스택과 완료 로그를 반환한다")
    void readsDetailWithStackAndSuccess() throws Exception {
        String queryId = service.start("prod", "7d", "5xx", "request-200").queryId();
        String stack = "java.lang.IllegalStateException: failure\n\tat example.Service.run(Service.java:1)\nCaused by: cause";
        when(client.getQueryResults(any(GetQueryResultsRequest.class))).thenReturn(complete(List.of(
                row(Map.of("@timestamp", "2026-11-11 03:00:02.000", "request_id", "request-200", "status", "200",
                        "duration_ms", "12", "http_method", "GET", "path", "/api/properties", "member_id", "123", "message", "HTTP request completed")),
                row(Map.of("@timestamp", "2026-11-11T03:00:01.000Z", "request_id", "request-200", "error.type", "java.lang.IllegalStateException",
                        "error.message", "failure", "error.stack_trace", stack, "@ptr", "private-pointer",
                        "request_body", "secret-body", "query_string", "secret-query", "request_headers", "secret-token")))));

        var result = service.results(queryId);

        assertThat(result.logs()).hasSize(2);
        assertThat(result.logs().getFirst().stackTrace()).isEqualTo(stack);
        assertThat(result.logs().getFirst().exceptionType()).isEqualTo("java.lang.IllegalStateException");
        assertThat(result.logs().getFirst().errorMessage()).isEqualTo("failure");
        assertThat(result.logs().getFirst().status()).isNull();
        assertThat(result.logs().getLast().status()).isEqualTo(200);
        assertThat(result.logs().getLast().durationMs()).isEqualTo(12);
        assertThat(result.logs().getLast().memberId()).isEqualTo(123L);
        assertThat(result.logs().getFirst().memberId()).isNull();
        assertThat(new ObjectMapper().findAndRegisterModules().writeValueAsString(result))
                .doesNotContain("secret-body", "secret-query", "secret-token", "private-pointer", "aws-private-id");
        var request = ArgumentCaptor.forClass(StartQueryRequest.class);
        verify(client).startQuery(request.capture());
        assertThat(request.getValue().queryString()).contains("request_id = 'request-200'", "sort @timestamp asc")
                .doesNotContain("status >=", "status <");
    }

    @Test
    @DisplayName("목록은 최신순이며 없는 필드나 스택을 만들어 반환하지 않는다")
    void sortsErrorsAndKeepsAbsentFieldsNull() {
        String queryId = service.start("dev", "1h", "all", null).queryId();
        when(client.getQueryResults(any(GetQueryResultsRequest.class))).thenReturn(complete(List.of(
                row(Map.of("@timestamp", "2026-11-11 02:00:00.000", "status", "404")),
                row(Map.of("@timestamp", "2026-11-11 03:00:00.000", "status", "500", "error_type", "Failure")))));

        var logs = service.results(queryId).logs();

        assertThat(logs).extracting(log -> log.status()).containsExactly(500, 404);
        assertThat(logs.getLast().stackTrace()).isNull();
        assertThat(logs.getLast().errorMessage()).isNull();
        assertThat(logs.getLast().durationMs()).isNull();
        assertThat(logs.getLast().memberId()).isNull();
    }

    @Test
    @DisplayName("완료된 빈 조회와 실행 중 부분 결과를 구분하고 StartQuery를 다시 실행하지 않는다")
    void pollsExistingQueryWithoutReturningPartialResults() {
        String queryId = service.start("dev", "1h", "all", null).queryId();
        when(client.getQueryResults(any(GetQueryResultsRequest.class)))
                .thenReturn(GetQueryResultsResponse.builder().status("Scheduled").build())
                .thenReturn(GetQueryResultsResponse.builder().status("Running").results(List.of(row(Map.of("status", "500")))).build())
                .thenReturn(complete(List.of()));

        assertThat(service.results(queryId).status()).isEqualTo("Scheduled");
        assertThat(service.results(queryId).logs()).isNull();
        assertThat(service.results(queryId).logs()).isEmpty();
        verify(client, times(1)).startQuery(any(StartQueryRequest.class));
        verify(client, times(3)).getQueryResults(GetQueryResultsRequest.builder().queryId("aws-private-id").build());
    }

    @ParameterizedTest
    @CsvSource({"Failed,ADMIN_LOG_QUERY_FAILED", "Cancelled,ADMIN_LOG_QUERY_CANCELLED", "Timeout,ADMIN_LOG_QUERY_TIMEOUT", "Unknown,ADMIN_LOG_UNAVAILABLE"})
    @DisplayName("AWS 비정상 종료와 알 수 없는 상태를 완료로 표시하지 않는다")
    void handlesTerminalStatuses(String status, ErrorCode code) {
        String queryId = service.start("dev", "1h", "all", null).queryId();
        when(client.getQueryResults(any(GetQueryResultsRequest.class)))
                .thenReturn(GetQueryResultsResponse.builder().status(status).build());
        assertCode(() -> service.results(queryId), code);
    }

    @ParameterizedTest
    @CsvSource({"AccessDeniedException,ADMIN_LOG_ACCESS_DENIED", "ResourceNotFoundException,ADMIN_LOG_GROUP_NOT_FOUND",
            "ServiceUnavailableException,ADMIN_LOG_UNAVAILABLE", "ThrottlingException,ADMIN_LOG_QUERY_LIMIT"})
    @DisplayName("AWS 권한·그룹 누락·서비스·제한 오류를 안전한 코드로 구분한다")
    void mapsAwsErrors(String awsCode, ErrorCode expected) {
        when(client.startQuery(any(StartQueryRequest.class))).thenThrow(CloudWatchLogsException.builder()
                .message("private AWS credentials or query text")
                .awsErrorDetails(AwsErrorDetails.builder().errorCode(awsCode).build()).build());
        assertThatThrownBy(() -> service.start("dev", "1h", "all", null)).isInstanceOfSatisfying(JachwiException.class, error -> {
            assertThat(error.getErrorCode()).isEqualTo(expected);
            assertThat(error.getMessage()).doesNotContain("private");
            assertThat(error.getCause()).isNull();
        });
    }

    @Test
    @DisplayName("AWS 단일 호출 시간 초과와 결과 조회 권한 오류를 처리한다")
    void handlesPollErrors() {
        String queryId = service.start("dev", "1h", "all", null).queryId();
        when(client.getQueryResults(any(GetQueryResultsRequest.class)))
                .thenThrow(ApiCallTimeoutException.create(5000))
                .thenThrow(CloudWatchLogsException.builder().statusCode(403).build());
        assertCode(() -> service.results(queryId), ErrorCode.ADMIN_LOG_QUERY_TIMEOUT);
        assertCode(() -> service.results(queryId), ErrorCode.ADMIN_LOG_ACCESS_DENIED);
    }

    @Test
    @DisplayName("임의의 AWS 쿼리 ID나 만료된 서버 ID로는 결과를 조회할 수 없다")
    void rejectsUnknownAndExpiredQueries() {
        assertCode(() -> service.results("aws-private-id"), ErrorCode.ADMIN_LOG_QUERY_NOT_FOUND);
        String queryId = service.start("dev", "1h", "all", null).queryId();
        when(clock.instant()).thenReturn(NOW.plusSeconds(300));
        assertCode(() -> service.results(queryId), ErrorCode.ADMIN_LOG_QUERY_NOT_FOUND);
        verify(client, never()).getQueryResults(any(GetQueryResultsRequest.class));
    }

    @Test
    @DisplayName("60초를 넘긴 조회는 한 번 중단하고 이후 폴링에서도 시간 초과를 유지한다")
    void expiresLongQuery() {
        String queryId = service.start("dev", "1h", "all", null).queryId();
        when(clock.instant()).thenReturn(NOW.plusSeconds(60));
        assertCode(() -> service.results(queryId), ErrorCode.ADMIN_LOG_QUERY_TIMEOUT);
        assertCode(() -> service.results(queryId), ErrorCode.ADMIN_LOG_QUERY_TIMEOUT);
        verify(client).stopQuery(any(StopQueryRequest.class));
        verify(client, never()).getQueryResults(any(GetQueryResultsRequest.class));
    }

    @Test
    @DisplayName("브라우저가 닫혀도 예약된 작업이 조회를 중단하며 중단 오류 원문은 전파하지 않는다")
    void stopsAbandonedQuery() {
        String queryId = service.start("dev", "1h", "all", null).queryId();
        when(client.stopQuery(any(StopQueryRequest.class))).thenThrow(CloudWatchLogsException.builder().statusCode(403).build());
        var timeout = ArgumentCaptor.forClass(Runnable.class);
        verify(scheduler).schedule(timeout.capture(), org.mockito.ArgumentMatchers.eq(NOW.plusSeconds(60)));
        timeout.getValue().run();
        assertCode(() -> service.results(queryId), ErrorCode.ADMIN_LOG_QUERY_TIMEOUT);
    }

    @Test
    @DisplayName("완료된 쿼리는 예약 시간이 되어도 중단하지 않는다")
    void doesNotStopCompletedQuery() {
        String queryId = service.start("dev", "1h", "all", null).queryId();
        when(client.getQueryResults(any(GetQueryResultsRequest.class))).thenReturn(complete(List.of()));
        service.results(queryId);
        var timeout = ArgumentCaptor.forClass(Runnable.class);
        verify(scheduler).schedule(timeout.capture(), org.mockito.ArgumentMatchers.eq(NOW.plusSeconds(60)));
        timeout.getValue().run();
        verify(client, never()).stopQuery(any(StopQueryRequest.class));
    }

    @Test
    @DisplayName("서버 등록 한도와 반환 100건 제한을 적용한다")
    void boundsQueriesAndResults() {
        String queryId = service.start("dev", "1h", "all", null).queryId();
        List<List<ResultField>> rows = new ArrayList<>();
        for (int index = 0; index < 101; index++) rows.add(row(Map.of("status", "500")));
        when(client.getQueryResults(any(GetQueryResultsRequest.class))).thenReturn(complete(rows));
        assertThat(service.results(queryId).logs()).hasSize(100);
        for (int index = 1; index < 100; index++) service.start("dev", "1h", "all", null);
        assertCode(() -> service.start("dev", "1h", "all", null), ErrorCode.ADMIN_LOG_QUERY_LIMIT);
        verify(client, times(100)).startQuery(any(StartQueryRequest.class));
    }

    private List<ResultField> row(Map<String, String> fields) {
        return fields.entrySet().stream().map(entry -> ResultField.builder().field(entry.getKey()).value(entry.getValue()).build()).toList();
    }

    @Test
    @DisplayName("동시 시작과 동일 조회의 중복 폴링은 느린 AWS 응답을 기다리지 않고 거절한다")
    void rejectsConcurrentRequestsWithoutWaiting() throws Exception {
        var startEntered = new CountDownLatch(1);
        var releaseStart = new CountDownLatch(1);
        when(client.startQuery(any(StartQueryRequest.class))).thenAnswer(invocation -> {
            startEntered.countDown();
            assertThat(releaseStart.await(5, TimeUnit.SECONDS)).isTrue();
            return StartQueryResponse.builder().queryId("aws-private-id").build();
        });
        try (var executor = Executors.newSingleThreadExecutor()) {
            var started = executor.submit(() -> service.start("dev", "1h", "all", null));
            try {
                assertThat(startEntered.await(5, TimeUnit.SECONDS)).isTrue();
                assertCode(() -> service.start("dev", "1h", "all", null), ErrorCode.ADMIN_LOG_QUERY_LIMIT);
            } finally {
                releaseStart.countDown();
            }
            String queryId = started.get(5, TimeUnit.SECONDS).queryId();
            var pollEntered = new CountDownLatch(1);
            var releasePoll = new CountDownLatch(1);
            when(client.getQueryResults(any(GetQueryResultsRequest.class))).thenAnswer(invocation -> {
                pollEntered.countDown();
                assertThat(releasePoll.await(5, TimeUnit.SECONDS)).isTrue();
                return complete(List.of());
            });
            var result = executor.submit(() -> service.results(queryId));
            try {
                assertThat(pollEntered.await(5, TimeUnit.SECONDS)).isTrue();
                assertCode(() -> service.results(queryId), ErrorCode.ADMIN_LOG_QUERY_LIMIT);
            } finally {
                releasePoll.countDown();
            }
            assertThat(result.get(5, TimeUnit.SECONDS).status()).isEqualTo("Complete");
        }
    }

    private GetQueryResultsResponse complete(List<List<ResultField>> rows) {
        return GetQueryResultsResponse.builder().status("Complete").results(rows).build();
    }

    private void assertCode(Runnable action, ErrorCode code) {
        assertThatThrownBy(action::run).isInstanceOfSatisfying(JachwiException.class,
                error -> assertThat(error.getErrorCode()).isEqualTo(code));
    }
}
