package com.jachwisunbae.admin.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.jachwisunbae.admin.service.result.AdminLogEntry;
import com.jachwisunbae.admin.service.result.AdminLogQuery;
import com.jachwisunbae.common.exception.client.InvalidInputException;
import com.jachwisunbae.common.exception.client.ResourceNotFoundException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.ServiceUnavailableException;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.locks.ReentrantLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.exception.ApiCallTimeoutException;
import software.amazon.awssdk.core.exception.ApiCallAttemptTimeoutException;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.services.cloudwatchlogs.CloudWatchLogsClient;
import software.amazon.awssdk.services.cloudwatchlogs.model.CloudWatchLogsException;
import software.amazon.awssdk.services.cloudwatchlogs.model.GetQueryResultsRequest;
import software.amazon.awssdk.services.cloudwatchlogs.model.ResultField;
import software.amazon.awssdk.services.cloudwatchlogs.model.StartQueryRequest;
import software.amazon.awssdk.services.cloudwatchlogs.model.StopQueryRequest;

@Service
public class AdminLogService {

    private static final Logger LOG = LoggerFactory.getLogger(AdminLogService.class);
    private static final Duration QUERY_TIMEOUT = Duration.ofSeconds(60);
    private static final Duration QUERY_RETENTION = Duration.ofMinutes(5);
    private static final int MAX_QUERIES = 100;
    private static final int MAX_RESULTS = 100;
    private static final String FIELDS = "fields @timestamp, request_id, http_method, path, status, "
            + "duration_ms, message, error_type, member_id";
    private final CloudWatchLogsClient client;
    private final Clock clock;
    private final TaskScheduler scheduler;
    private final ReentrantLock registrationLock = new ReentrantLock();
    private final Cache<String, Query> queries = Caffeine.newBuilder()
            .expireAfterWrite(QUERY_RETENTION).maximumSize(MAX_QUERIES).build();

    public AdminLogService(CloudWatchLogsClient client, Clock clock,
            @Qualifier("adminLogsScheduler") TaskScheduler scheduler) {
        this.client = client;
        this.clock = clock;
        this.scheduler = scheduler;
    }

    public AdminLogQuery start(String environment, String period, String status, String requestId) {
        String group = switch (environment) {
            case "dev" -> "/jachwi-sunbae/dev/application";
            case "prod" -> "/jachwi-sunbae/prod/application";
            default -> throw invalidInput();
        };
        Duration range = switch (period) {
            case "1h" -> Duration.ofHours(1);
            case "24h" -> Duration.ofHours(24);
            case "7d" -> Duration.ofDays(7);
            default -> throw invalidInput();
        };
        String filter = switch (status) {
            case "all" -> "status >= 400 and status < 600";
            case "4xx" -> "status >= 400 and status < 500";
            case "5xx" -> "status >= 500 and status < 600";
            default -> throw invalidInput();
        };
        boolean detail = requestId != null;
        if (detail && !requestId.matches("[a-zA-Z0-9_-]{1,128}")) throw invalidInput();
        String queryString = detail
                ? FIELDS + ", error.type, error.message, error.stack_trace"
                        + " | filter request_id = '" + requestId + "' | sort @timestamp asc | limit 100"
                : FIELDS + " | filter " + filter + " | sort @timestamp desc | limit 100";
        // 느린 AWS 호출 뒤로 HTTP 요청이 줄지어 대기하지 않도록 즉시 거절한다.
        if (!registrationLock.tryLock()) throw queryLimit();
        try {
            return register(group, range, queryString, detail);
        } finally {
            registrationLock.unlock();
        }
    }

    private AdminLogQuery register(String group, Duration range, String queryString, boolean detail) {
        queries.cleanUp();
        if (queries.estimatedSize() >= MAX_QUERIES) {
            throw queryLimit();
        }
        Instant now = clock.instant();
        String awsQueryId;
        try {
            awsQueryId = client.startQuery(StartQueryRequest.builder()
                    .logGroupName(group).startTime(now.minus(range).getEpochSecond())
                    .endTime(now.getEpochSecond()).limit(MAX_RESULTS).queryString(queryString).build()).queryId();
        } catch (SdkException exception) {
            throw upstream(classify(exception, true));
        }
        if (awsQueryId == null || awsQueryId.isBlank()) throw upstream(ErrorCode.ADMIN_LOG_UNAVAILABLE);
        String queryId = UUID.randomUUID().toString();
        Query query = new Query(awsQueryId, now.minus(range), now, detail);
        queries.put(queryId, query);
        // 브라우저가 닫혀 폴링이 끊겨도 조회를 중단한다. 일반 업무 스케줄러와 분리한다.
        scheduler.schedule(() -> expire(query), now.plus(QUERY_TIMEOUT));
        return response(queryId, query, "Scheduled", null);
    }

    public AdminLogQuery results(String queryId) {
        Query query = queries.getIfPresent(queryId);
        if (query == null || !clock.instant().isBefore(query.end.plus(QUERY_RETENTION))) {
            throw new ResourceNotFoundException(ErrorCode.ADMIN_LOG_QUERY_NOT_FOUND, "등록되지 않았거나 만료된 로그 조회");
        }
        if (!query.lock.tryLock()) throw queryLimit();
        try {
            if (!query.finished && !clock.instant().isBefore(query.end.plus(QUERY_TIMEOUT))) expire(query);
            if (query.failure != null) throw upstream(query.failure);
            try {
                var result = client.getQueryResults(GetQueryResultsRequest.builder().queryId(query.awsId).build());
                if (result.status() == null) throw upstream(ErrorCode.ADMIN_LOG_UNAVAILABLE);
                return switch (result.status()) {
                    case SCHEDULED, RUNNING -> response(queryId, query, result.statusAsString(), null);
                    case COMPLETE -> {
                        query.finished = true;
                        Comparator<AdminLogEntry> order = Comparator.comparing(AdminLogEntry::timestamp,
                                Comparator.nullsLast(Comparator.naturalOrder()));
                        if (!query.detail) order = Comparator.comparing(AdminLogEntry::timestamp,
                                Comparator.nullsLast(Comparator.reverseOrder()));
                        List<AdminLogEntry> logs = result.results().stream()
                                .map(row -> map(row, query.detail)).sorted(order).limit(MAX_RESULTS).toList();
                        yield response(queryId, query, "Complete", logs);
                    }
                    case FAILED -> throw fail(query, ErrorCode.ADMIN_LOG_QUERY_FAILED);
                    case CANCELLED -> throw fail(query, ErrorCode.ADMIN_LOG_QUERY_CANCELLED);
                    case TIMEOUT -> throw fail(query, ErrorCode.ADMIN_LOG_QUERY_TIMEOUT);
                    default -> throw upstream(ErrorCode.ADMIN_LOG_UNAVAILABLE);
                };
            } catch (SdkException exception) {
                throw upstream(classify(exception, false));
            }
        } finally {
            query.lock.unlock();
        }
    }

    private void expire(Query query) {
        query.lock.lock();
        try {
            if (query.finished) return;
            query.finished = true;
            query.failure = ErrorCode.ADMIN_LOG_QUERY_TIMEOUT;
            try {
                client.stopQuery(StopQueryRequest.builder().queryId(query.awsId).build());
            } catch (SdkException exception) {
                // AWS 원문이나 쿼리 ID, 조회한 로그는 기록하지 않는다.
                LOG.warn("관리자 로그 조회 중단 실패: code={}", classify(exception, false));
            }
        } finally {
            query.lock.unlock();
        }
    }

    private AdminLogEntry map(List<ResultField> row, boolean detail) {
        Map<String, String> fields = new HashMap<>();
        row.forEach(field -> fields.put(field.field(), field.value()));
        try {
            String timestamp = fields.get("@timestamp");
            Instant instant = timestamp == null ? null : parseTimestamp(timestamp);
            return new AdminLogEntry(instant, fields.get("request_id"), fields.get("http_method"), fields.get("path"),
                    fields.containsKey("member_id") ? Long.valueOf(fields.get("member_id")) : null,
                    fields.containsKey("status") ? Integer.valueOf(fields.get("status")) : null,
                    fields.containsKey("duration_ms") ? Long.valueOf(fields.get("duration_ms")) : null,
                    fields.get("message"), fields.get("error_type"),
                    detail ? fields.get("error.type") : null, detail ? fields.get("error.message") : null,
                    detail ? fields.get("error.stack_trace") : null);
        } catch (NumberFormatException | DateTimeParseException exception) {
            throw upstream(ErrorCode.ADMIN_LOG_UNAVAILABLE);
        }
    }

    private Instant parseTimestamp(String value) {
        // Logs Insights의 @timestamp는 UTC이며 공백 구분 형식에는 오프셋이 없다.
        return Instant.parse(value.contains(" ") ? value.replace(' ', 'T') + "Z" : value);
    }

    private AdminLogQuery response(String queryId, Query query, String status, List<AdminLogEntry> logs) {
        return new AdminLogQuery(queryId, status, query.start, query.end, logs);
    }

    private UpstreamServiceException fail(Query query, ErrorCode code) {
        query.finished = true;
        query.failure = code;
        return upstream(code);
    }

    private ErrorCode classify(SdkException exception, boolean starting) {
        if (exception instanceof ApiCallTimeoutException || exception instanceof ApiCallAttemptTimeoutException) {
            return ErrorCode.ADMIN_LOG_QUERY_TIMEOUT;
        }
        if (exception instanceof CloudWatchLogsException aws) {
            String code = aws.awsErrorDetails() == null ? "" : aws.awsErrorDetails().errorCode();
            if (aws.statusCode() == 403 || "AccessDeniedException".equals(code)) return ErrorCode.ADMIN_LOG_ACCESS_DENIED;
            if ("ResourceNotFoundException".equals(code)) {
                return starting ? ErrorCode.ADMIN_LOG_GROUP_NOT_FOUND : ErrorCode.ADMIN_LOG_QUERY_NOT_FOUND;
            }
            if ("LimitExceededException".equals(code) || "ThrottlingException".equals(code)) {
                return ErrorCode.ADMIN_LOG_QUERY_LIMIT;
            }
        }
        return ErrorCode.ADMIN_LOG_UNAVAILABLE;
    }

    private UpstreamServiceException upstream(ErrorCode code) {
        // 공통 예외 처리기가 기록하므로 AWS 예외 원문을 cause로 연결하지 않는다.
        return new UpstreamServiceException(code, "관리자 CloudWatch 조회 실패: " + code.name());
    }

    private InvalidInputException invalidInput() {
        return new InvalidInputException(ErrorCode.ADMIN_LOG_INPUT_INVALID, "허용하지 않는 관리자 로그 조회 조건");
    }

    private ServiceUnavailableException queryLimit() {
        return new ServiceUnavailableException(ErrorCode.ADMIN_LOG_QUERY_LIMIT, "관리자 로그 조회 등록 또는 동시 호출 한도 초과");
    }

    private static final class Query {
        private final ReentrantLock lock = new ReentrantLock();
        private final String awsId;
        private final Instant start;
        private final Instant end;
        private final boolean detail;
        private boolean finished;
        private ErrorCode failure;

        private Query(String awsId, Instant start, Instant end, boolean detail) {
            this.awsId = awsId;
            this.start = start;
            this.end = end;
            this.detail = detail;
        }
    }
}
