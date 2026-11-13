package com.jachwisunbae.admin.service.result;

import java.time.Instant;
import java.util.List;

public record AdminPostHogEvent(
        String eventId, Instant timestamp, String distinctId, Long memberId,
        String environment, String platform, String screenRoute, String errorCategory, String severity,
        String requestMethod, String requestPath, Integer responseStatus, String errorCode, String requestId,
        List<ExceptionDetail> exceptions
) {
    public record ExceptionDetail(String type, String message, List<StackFrame> frames) {
    }

    public record StackFrame(String filename, String function, Integer line, Integer column) {
    }
}
