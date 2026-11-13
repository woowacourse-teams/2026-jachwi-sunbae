package com.jachwisunbae.admin.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jachwisunbae.admin.service.result.AdminPostHogEvent;
import com.jachwisunbae.admin.service.result.AdminPostHogEvent.ExceptionDetail;
import com.jachwisunbae.admin.service.result.AdminPostHogEvent.StackFrame;
import com.jachwisunbae.admin.service.result.AdminPostHogResult;
import com.jachwisunbae.common.exception.client.InvalidInputException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.ServiceUnavailableException;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import java.net.SocketTimeoutException;
import java.net.http.HttpClient;
import java.net.http.HttpTimeoutException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class AdminPostHogService {

    private static final List<String> COLUMNS = List.of("eventId", "timestamp", "distinctId", "environment", "platform",
            "screenRoute", "errorCategory", "severity", "requestMethod", "requestPath", "responseStatus", "errorCode",
            "requestId", "exceptions");
    private static final String SELECT = """
            SELECT uuid AS eventId, timestamp AS timestamp, distinct_id AS distinctId,
                properties.environment AS environment, properties.platform AS platform,
                properties.screen_route AS screenRoute, properties.error_category AS errorCategory,
                properties.severity AS severity, properties.request_method AS requestMethod,
                properties.request_path AS requestPath, properties.response_status AS responseStatus,
                properties.error_code AS errorCode, properties.request_id AS requestId,
                properties.$exception_list AS exceptions
            FROM events WHERE event = '$exception'
            """;
    private final RestClient client;
    private final String apiKey;
    private final Clock clock;
    private final ObjectMapper mapper;

    @Autowired
    public AdminPostHogService(@Value("${POSTHOG_PERSONAL_API_KEY:}") String apiKey, Clock clock, ObjectMapper mapper) {
        this(createClient(), apiKey, clock, mapper);
    }

    AdminPostHogService(RestClient client, String apiKey, Clock clock, ObjectMapper mapper) {
        this.client = client;
        this.apiKey = apiKey.trim();
        this.clock = clock;
        this.mapper = mapper;
    }

    private static RestClient createClient() {
        var http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
        var factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(Duration.ofSeconds(15));
        return RestClient.builder().baseUrl("https://us.posthog.com").requestFactory(factory).build();
    }

    public AdminPostHogResult search(String environment, String period, String severity, String requestId) {
        String storedEnvironment = switch (environment) {
            case "dev" -> "development";
            case "prod" -> "production";
            default -> throw invalidInput();
        };
        Duration range = switch (period) {
            case "1h" -> Duration.ofHours(1);
            case "24h" -> Duration.ofHours(24);
            case "7d" -> Duration.ofDays(7);
            default -> throw invalidInput();
        };
        if (!List.of("all", "P0", "P1", "P2").contains(severity)) throw invalidInput();
        if (requestId != null && !requestId.matches("[a-zA-Z0-9_-]{1,128}")) throw invalidInput();
        if (apiKey.isEmpty()) {
            throw new ServiceUnavailableException(ErrorCode.ADMIN_POSTHOG_NOT_CONFIGURED, "PostHog 조회 키 미설정");
        }
        Instant end = clock.instant();
        Instant start = end.minus(range);
        String query = SELECT + " AND timestamp >= toDateTime(" + start.getEpochSecond() + ")"
                + " AND timestamp <= toDateTime(" + end.getEpochSecond() + ")"
                + " AND properties.environment = '" + storedEnvironment + "'"
                + (severity.equals("all") ? "" : " AND properties.severity = '" + severity + "'")
                + (requestId == null ? "" : " AND properties.request_id = '" + requestId + "'")
                + " ORDER BY timestamp DESC LIMIT 100";
        JsonNode response = request(query);
        if (response == null || !response.path("results").isArray() || !response.path("columns").isArray()
                || response.path("query_status").path("complete").isBoolean()
                && !response.path("query_status").path("complete").asBoolean()) {
            throw upstream(ErrorCode.ADMIN_POSTHOG_UNAVAILABLE);
        }
        Map<String, Integer> columns = new HashMap<>();
        for (int i = 0; i < response.path("columns").size(); i++) columns.put(response.path("columns").get(i).asText(), i);
        if (!columns.keySet().containsAll(COLUMNS)) throw upstream(ErrorCode.ADMIN_POSTHOG_UNAVAILABLE);
        List<AdminPostHogEvent> events = new ArrayList<>();
        for (JsonNode row : response.path("results")) {
            if (!row.isArray() || row.size() != response.path("columns").size()) throw upstream(ErrorCode.ADMIN_POSTHOG_UNAVAILABLE);
            events.add(event(row, columns));
        }
        return new AdminPostHogResult(start, end, events.stream()
                .sorted(Comparator.comparing(AdminPostHogEvent::timestamp, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(100).toList());
    }

    private JsonNode request(String query) {
        try {
            return client.post().uri("/api/projects/579863/query/")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON).accept(MediaType.APPLICATION_JSON)
                    .body(Map.of("query", Map.of("kind", "HogQLQuery", "query", query), "refresh", "force_blocking"))
                    .retrieve().onStatus(status -> !status.is2xxSuccessful(), (request, response) -> {
                        throw upstream(switch (response.getStatusCode().value()) {
                            case 401 -> ErrorCode.ADMIN_POSTHOG_AUTH_FAILED;
                            case 403 -> ErrorCode.ADMIN_POSTHOG_ACCESS_DENIED;
                            case 429 -> ErrorCode.ADMIN_POSTHOG_RATE_LIMITED;
                            case 408, 504 -> ErrorCode.ADMIN_POSTHOG_TIMEOUT;
                            default -> ErrorCode.ADMIN_POSTHOG_UNAVAILABLE;
                        });
                    }).body(JsonNode.class);
        } catch (ResourceAccessException exception) {
            Throwable cause = exception;
            while (cause != null) {
                if (cause instanceof HttpTimeoutException || cause instanceof SocketTimeoutException) {
                    throw upstream(ErrorCode.ADMIN_POSTHOG_TIMEOUT);
                }
                cause = cause.getCause();
            }
            throw upstream(ErrorCode.ADMIN_POSTHOG_UNAVAILABLE);
        } catch (RestClientException exception) {
            throw upstream(ErrorCode.ADMIN_POSTHOG_UNAVAILABLE);
        }
    }

    private AdminPostHogEvent event(JsonNode row, Map<String, Integer> columns) {
        String distinctId = text(row.get(columns.get("distinctId")));
        return new AdminPostHogEvent(text(row.get(columns.get("eventId"))), timestamp(row.get(columns.get("timestamp"))),
                distinctId, memberId(distinctId), text(row.get(columns.get("environment"))), text(row.get(columns.get("platform"))),
                text(row.get(columns.get("screenRoute"))), text(row.get(columns.get("errorCategory"))), text(row.get(columns.get("severity"))),
                text(row.get(columns.get("requestMethod"))), text(row.get(columns.get("requestPath"))), integer(row.get(columns.get("responseStatus"))),
                text(row.get(columns.get("errorCode"))), text(row.get(columns.get("requestId"))), exceptions(row.get(columns.get("exceptions"))));
    }

    private List<ExceptionDetail> exceptions(JsonNode value) {
        // HogQL의 JSON 속성은 문자열 또는 JSON 배열로 전달될 수 있다. 원문은 DTO에 넣지 않는다.
        if (value.isTextual()) {
            try {
                value = mapper.readTree(value.textValue());
            } catch (JsonProcessingException exception) {
                return null;
            }
        }
        if (value == null || !value.isArray()) return null;
        List<ExceptionDetail> exceptions = new ArrayList<>();
        for (JsonNode item : value) {
            if (!item.isObject()) continue;
            List<StackFrame> frames = null;
            if (item.path("stacktrace").path("frames").isArray()) {
                frames = new ArrayList<>();
                for (JsonNode frame : item.path("stacktrace").path("frames")) {
                    if (!frame.isObject()) continue;
                    String filename = text(frame.path("filename"));
                    frames.add(new StackFrame(filename == null ? null : filename.split("[?#]", 2)[0],
                            text(frame.path("function")), integer(frame.path("lineno")), integer(frame.path("colno"))));
                }
            }
            exceptions.add(new ExceptionDetail(text(item.path("type")), text(item.path("value")), frames));
        }
        return exceptions;
    }

    private Long memberId(String distinctId) {
        if (distinctId == null || !distinctId.matches("member-[1-9][0-9]*")) return null;
        try {
            return Long.valueOf(distinctId.substring("member-".length()));
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private String text(JsonNode value) {
        return value.isTextual() && !value.textValue().isEmpty() ? value.textValue() : null;
    }

    private Integer integer(JsonNode value) {
        if (value.isIntegralNumber() && value.canConvertToInt()) return value.intValue();
        if (!value.isTextual()) return null;
        try {
            return Integer.valueOf(value.textValue());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private Instant timestamp(JsonNode value) {
        String text = text(value);
        if (text == null) return null;
        try {
            return Instant.parse(text.replace(' ', 'T'));
        } catch (DateTimeParseException exception) {
            try {
                return LocalDateTime.parse(text.replace(' ', 'T')).toInstant(ZoneOffset.UTC);
            } catch (DateTimeParseException invalidTimestamp) {
                throw upstream(ErrorCode.ADMIN_POSTHOG_UNAVAILABLE);
            }
        }
    }

    private InvalidInputException invalidInput() {
        return new InvalidInputException(ErrorCode.ADMIN_POSTHOG_INPUT_INVALID, "허용하지 않는 PostHog 조회 조건");
    }

    private UpstreamServiceException upstream(ErrorCode code) {
        // 공통 예외 처리기는 메시지와 cause를 기록하므로 키·응답·쿼리 원문을 연결하지 않는다.
        return new UpstreamServiceException(code, "관리자 PostHog 조회 실패: " + code.name());
    }
}
