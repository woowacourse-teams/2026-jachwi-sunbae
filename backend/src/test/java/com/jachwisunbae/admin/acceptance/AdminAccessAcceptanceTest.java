package com.jachwisunbae.admin.acceptance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jachwisunbae.admin.auth.AdminAccessCodes;
import com.jachwisunbae.admin.controller.AdminLogController;
import com.jachwisunbae.admin.controller.AdminPostHogController;
import com.jachwisunbae.admin.controller.AdminQueryController;
import com.jachwisunbae.admin.repository.query.AdminMember;
import com.jachwisunbae.admin.repository.query.AdminSummary;
import com.jachwisunbae.admin.service.AdminLogService;
import com.jachwisunbae.admin.service.AdminPostHogService;
import com.jachwisunbae.admin.service.AdminQueryService;
import com.jachwisunbae.admin.service.result.AdminLogQuery;
import com.jachwisunbae.admin.service.result.AdminPostHogResult;
import com.jachwisunbae.admin.support.AdminTestCodes;
import com.jachwisunbae.admin.web.AdminAuthenticationFilter;
import com.jachwisunbae.auth.token.JwtTokenProvider;
import com.jachwisunbae.auth.web.JwtAuthenticationFilter;
import com.jachwisunbae.common.config.CorsConfig;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.ServiceUnavailableException;
import com.jachwisunbae.common.observability.RequestLoggingFilter;
import com.jachwisunbae.common.web.error.GlobalExceptionHandler;
import com.jachwisunbae.member.repository.MemberRepository;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@Tag("acceptance")
class AdminAccessAcceptanceTest {

    private static final String ORIGIN = "http://localhost:3000";
    private final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();
    private final JwtTokenProvider jwt = mock(JwtTokenProvider.class);
    private final MemberRepository members = mock(MemberRepository.class);
    private final AdminQueryService queries = mock(AdminQueryService.class);
    private final AdminLogService logs = mock(AdminLogService.class);
    private final AdminPostHogService posthog = mock(AdminPostHogService.class);
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        when(queries.summary()).thenReturn(new AdminSummary(12, 3, 8));
        when(queries.recentMembers()).thenReturn(List.of(
                new AdminMember(7, Instant.parse("2026-11-11T00:00:00Z"), 2, 5)));
        mvc = build(AdminTestCodes.configured());
    }

    private MockMvc build(String codes) {
        return MockMvcBuilders.standaloneSetup(new AdminQueryController(queries), new AdminLogController(logs),
                        new AdminPostHogController(posthog))
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(new RequestLoggingFilter(), new CorsConfig(List.of(ORIGIN)).corsFilter().getFilter(),
                        new AdminAuthenticationFilter(new AdminAccessCodes(codes), mapper),
                        new JwtAuthenticationFilter(jwt, members, mapper))
                .build();
    }

    @Test
    @DisplayName("접속 코드 열 개로 쿠키 없이 통계와 최근 회원을 조회한다")
    void readsWithAnyConfiguredCode() throws Exception {
        for (int index = 0; index < 10; index++) {
            mvc.perform(get("/api/admin/summary").accept(MediaType.APPLICATION_JSON)
                            .header("Authorization", "Admin " + AdminTestCodes.code(index)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data.activeAccounts").value(12))
                    .andExpect(header().doesNotExist("Set-Cookie"));
        }
        mvc.perform(get("/api/admin/members").accept(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Admin " + AdminTestCodes.code(0)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data[0].memberId").value(7))
                .andExpect(jsonPath("$.data[0].activePhotos").value(5));
        verifyNoInteractions(jwt, members);
    }

    @Test
    @DisplayName("접속 코드 누락·불일치와 일반 회원 JWT는 401로 거부한다")
    void deniesOtherCredentials() throws Exception {
        mvc.perform(get("/api/admin/summary")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/summary").header("Authorization", "Admin incorrect"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("ADMIN_ACCESS_DENIED"));
        mvc.perform(get("/api/admin/summary").header("Authorization", "Bearer member-jwt"))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(jwt, members);
    }

    @Test
    @DisplayName("설정이 없으면 접속할 수 없고 잘못 입력한 횟수로 제한하지 않는다")
    void handlesMissingConfigurationAndUnlimitedAttempts() throws Exception {
        mvc = build("");
        mvc.perform(get("/api/admin/summary").header("Authorization", "Admin " + AdminTestCodes.code(0)))
                .andExpect(status().isUnauthorized());
        mvc = build(AdminTestCodes.configured());
        for (int index = 0; index < 10; index++) {
            mvc.perform(get("/api/admin/summary").header("Authorization", "Admin incorrect"))
                    .andExpect(status().isUnauthorized());
        }
        mvc.perform(get("/api/admin/summary").accept(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Admin " + AdminTestCodes.code(0)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("관리자 요청의 코드·본문·쿼리·예외 원문은 로그에 남지 않는다")
    void keepsAdminLoggingExclusion() throws Exception {
        Logger root = (Logger) LoggerFactory.getLogger(Logger.ROOT_LOGGER_NAME);
        var appender = new ListAppender<ILoggingEvent>();
        appender.start();
        root.addAppender(appender);
        String secret = "test-only-never-log-code";
        try {
            mvc.perform(get("/api/admin/summary?accessCode=" + secret)
                            .header("Authorization", "Admin " + secret)
                            .header("User-Agent", secret).content("{\"accessCode\":\"" + secret + "\"}"))
                    .andExpect(status().isUnauthorized());
            String logs = appender.list.stream()
                    .map(event -> event.getFormattedMessage() + event.getKeyValuePairs() + event.getThrowableProxy())
                    .reduce("", (left, right) -> left + right);
            assertThat(logs).doesNotContain(secret);
            assertThat(logs).contains("Admin HTTP request failed");
        } finally {
            root.detachAppender(appender);
            appender.stop();
        }
    }

    @Test
    @DisplayName("기존 CORS의 Authorization 헤더와 X-Request-Id 노출을 재사용한다")
    void reusesCorsAndRequestId() throws Exception {
        mvc.perform(options("/api/admin/summary").header("Origin", ORIGIN)
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "Authorization"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/admin/summary").accept(MediaType.APPLICATION_JSON).header("Origin", ORIGIN)
                        .header("Authorization", "Admin " + AdminTestCodes.code(0)))
                .andExpect(status().isOk()).andExpect(header().exists("X-Request-Id"))
                .andExpect(header().string("Access-Control-Expose-Headers", "X-Request-Id"));
    }

    @Test
    @DisplayName("새 로그 조회 시작·폴링 API도 기존 관리자 코드만 허용한다")
    void protectsLogQueries() throws Exception {
        mvc.perform(post("/api/admin/log-queries?environment=dev&period=1h"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/log-queries/unknown").header("Authorization", "Bearer member-jwt"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/log-queries/unknown").header("Authorization", "Admin incorrect"))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(logs, jwt, members);

        var pending = new AdminLogQuery("server-query", "Scheduled", Instant.EPOCH, Instant.EPOCH, null);
        when(logs.start("dev", "1h", "all", null)).thenReturn(pending);
        when(logs.results("server-query")).thenReturn(pending);
        mvc.perform(post("/api/admin/log-queries?environment=dev&period=1h")
                        .accept(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Admin " + AdminTestCodes.code(0)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.status").value("Scheduled"))
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().doesNotExist("Set-Cookie"));
        mvc.perform(get("/api/admin/log-queries/server-query")
                        .accept(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Admin " + AdminTestCodes.code(0)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.queryId").value("server-query"));
        mvc.perform(post("/api/admin/log-queries?environment=dev")
                        .header("Authorization", "Admin " + AdminTestCodes.code(0)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PostHog 조회는 기존 관리자 코드로만 접근하고 쿠키 없이 필요한 조건을 전달한다")
    void protectsPostHogQueries() throws Exception {
        String path = "/api/admin/posthog-errors?environment=prod&period=24h&severity=P1&requestId=request-123";
        mvc.perform(get(path)).andExpect(status().isUnauthorized());
        mvc.perform(get(path).header("Authorization", "Bearer member-jwt")).andExpect(status().isUnauthorized());
        mvc.perform(get(path).header("Authorization", "Admin incorrect")).andExpect(status().isUnauthorized());
        verifyNoInteractions(posthog, jwt, members);
        when(posthog.search("prod", "24h", "P1", "request-123"))
                .thenReturn(new AdminPostHogResult(Instant.EPOCH, Instant.EPOCH, List.of()));

        mvc.perform(get(path).accept(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Admin " + AdminTestCodes.code(0)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.events").isEmpty())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().doesNotExist("Set-Cookie"));
        mvc.perform(get("/api/admin/posthog-errors?environment=dev")
                        .header("Authorization", "Admin " + AdminTestCodes.code(0)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PostHog 키 미설정은 설정 오류와 503을 반환하며 관리자 입력은 응답·로그에 노출하지 않는다")
    void reportsPostHogMissingConfiguration() throws Exception {
        when(posthog.search("dev", "1h", "all", null)).thenThrow(
                new ServiceUnavailableException(ErrorCode.ADMIN_POSTHOG_NOT_CONFIGURED, "PostHog 조회 키 미설정"));
        Logger root = (Logger) LoggerFactory.getLogger(Logger.ROOT_LOGGER_NAME);
        var appender = new ListAppender<ILoggingEvent>();
        appender.start();
        root.addAppender(appender);
        try {
            var result = mvc.perform(get("/api/admin/posthog-errors?environment=dev&period=1h&extra=private-test-key")
                            .accept(MediaType.APPLICATION_JSON)
                            .header("Authorization", "Admin " + AdminTestCodes.code(0)))
                    .andExpect(status().isServiceUnavailable())
                    .andExpect(jsonPath("$.code").value("ADMIN_POSTHOG_NOT_CONFIGURED"))
                    .andReturn();
            assertThat(result.getResponse().getContentAsString()).doesNotContain("private-test-key");
            assertThat(appender.list.stream().map(event -> event.getFormattedMessage() + event.getKeyValuePairs()
                    + event.getThrowableProxy()).toList()).allSatisfy(message -> assertThat(message).doesNotContain("private-test-key"));
        } finally {
            root.detachAppender(appender);
            appender.stop();
        }
    }
}
