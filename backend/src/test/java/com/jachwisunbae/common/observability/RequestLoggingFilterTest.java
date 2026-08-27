package com.jachwisunbae.common.observability;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import jakarta.servlet.ServletException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RequestLoggingFilterTest {

    private final RequestLoggingFilter filter = new RequestLoggingFilter();
    private final Logger logger = (Logger) LoggerFactory.getLogger(RequestLoggingFilter.class);
    private ListAppender<ILoggingEvent> appender;

    @BeforeEach
    void setUp() {
        appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
    }

    @AfterEach
    void tearDown() {
        logger.detachAppender(appender);
        appender.stop();
        MDC.clear();
    }

    @Test
    void 요청_ID와_응답_정보를_구조화_로그로_남긴다() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/check-items");
        request.setQueryString("stage=MOVE_IN");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (servletRequest, servletResponse) ->
                ((MockHttpServletResponse) servletResponse).setStatus(201));

        String requestId = response.getHeader(RequestLoggingFilter.REQUEST_ID_HEADER);
        ILoggingEvent event = singleEvent();
        Map<String, String> context = event.getMDCPropertyMap();
        Map<String, Object> keyValues = keyValuesOf(event);

        assertThat(requestId).isNotBlank();
        assertThat(event.getLevel()).isEqualTo(Level.INFO);
        assertThat(context)
                .containsEntry("request_id", requestId)
                .containsEntry("http_method", "GET")
                .containsEntry("path", "/api/check-items")
                .doesNotContainValue("stage=MOVE_IN");
        assertThat(keyValues)
                .containsEntry("status", 201)
                .containsKey("duration_ms");
        assertThat(MDC.get("request_id")).isNull();
    }

    @Test
    void 처리되지_않은_예외를_오류_로그로_남긴다() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/failure");
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertThatThrownBy(() -> filter.doFilter(request, response, (servletRequest, servletResponse) -> {
            throw new ServletException("forced failure");
        })).isInstanceOf(ServletException.class);

        ILoggingEvent event = singleEvent();
        assertThat(event.getLevel()).isEqualTo(Level.ERROR);
        assertThat(event.getThrowableProxy()).isNotNull();
        assertThat(keyValuesOf(event))
                .containsEntry("status", 500)
                .containsEntry("error_type", ServletException.class.getName());
    }

    private ILoggingEvent singleEvent() {
        assertThat(appender.list).hasSize(1);
        return appender.list.getFirst();
    }

    private Map<String, Object> keyValuesOf(final ILoggingEvent event) {
        return List.copyOf(event.getKeyValuePairs()).stream()
                .collect(Collectors.toMap(pair -> pair.key, pair -> pair.value));
    }
}
