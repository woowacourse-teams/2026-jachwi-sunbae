package com.jachwisunbae.common.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.slf4j.spi.LoggingEventBuilder;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class RequestLoggingFilter extends OncePerRequestFilter {

    public static final String REQUEST_ID_HEADER = "X-Request-Id";

    private static final Logger LOG = LoggerFactory.getLogger(RequestLoggingFilter.class);
    private static final String REQUEST_ID = "request_id";
    private static final String HTTP_METHOD = "http_method";
    private static final String PATH = "path";
    private static final String STATUS = "status";
    private static final String DURATION_MILLIS = "duration_ms";
    private static final String ERROR_TYPE = "error_type";

    @Override
    protected void doFilterInternal(
            final HttpServletRequest request,
            final HttpServletResponse response,
            final FilterChain chain) throws ServletException, IOException {
        Map<String, String> previousContext = MDC.getCopyOfContextMap();
        String requestId = UUID.randomUUID().toString();
        long startedAt = System.nanoTime();
        Throwable failure = null;

        response.setHeader(REQUEST_ID_HEADER, requestId);
        MDC.put(REQUEST_ID, requestId);
        MDC.put(HTTP_METHOD, request.getMethod());
        MDC.put(PATH, request.getRequestURI());

        try {
            chain.doFilter(request, response);
        } catch (IOException | ServletException exception) {
            failure = exception;
            throw exception;
        } catch (RuntimeException | Error exception) {
            failure = exception;
            throw exception;
        } finally {
            logCompletedRequest(response, startedAt, failure);
            restoreContext(previousContext);
        }
    }

    private void logCompletedRequest(
            final HttpServletResponse response,
            final long startedAt,
            final Throwable failure) {
        long durationMillis = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedAt);
        int status = failure == null ? response.getStatus() : HttpServletResponse.SC_INTERNAL_SERVER_ERROR;
        LoggingEventBuilder event = status >= HttpServletResponse.SC_INTERNAL_SERVER_ERROR
                ? LOG.atError()
                : LOG.atInfo();

        event.addKeyValue(STATUS, status)
                .addKeyValue(DURATION_MILLIS, durationMillis);

        if (failure != null) {
            event.addKeyValue(ERROR_TYPE, failure.getClass().getName())
                    .setCause(failure)
                    .log("HTTP request failed");
            return;
        }
        event.log("HTTP request completed");
    }

    private void restoreContext(final Map<String, String> previousContext) {
        if (previousContext == null) {
            MDC.clear();
            return;
        }
        MDC.setContextMap(previousContext);
    }
}
