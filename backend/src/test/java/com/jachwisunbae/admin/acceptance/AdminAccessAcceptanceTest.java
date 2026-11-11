package com.jachwisunbae.admin.acceptance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jachwisunbae.admin.auth.AdminAccessCodes;
import com.jachwisunbae.admin.controller.AdminQueryController;
import com.jachwisunbae.admin.repository.query.AdminMember;
import com.jachwisunbae.admin.repository.query.AdminSummary;
import com.jachwisunbae.admin.service.AdminQueryService;
import com.jachwisunbae.admin.support.AdminTestCodes;
import com.jachwisunbae.admin.web.AdminAuthenticationFilter;
import com.jachwisunbae.auth.token.JwtTokenProvider;
import com.jachwisunbae.auth.web.JwtAuthenticationFilter;
import com.jachwisunbae.common.config.CorsConfig;
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
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        when(queries.summary()).thenReturn(new AdminSummary(12, 3, 8));
        when(queries.recentMembers()).thenReturn(List.of(
                new AdminMember(7, Instant.parse("2026-11-11T00:00:00Z"), 2, 5)));
        mvc = build(AdminTestCodes.configured());
    }

    private MockMvc build(String codes) {
        return MockMvcBuilders.standaloneSetup(new AdminQueryController(queries))
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
}
