package com.jachwisunbae.admin.service.result;

import java.time.Instant;

// CloudWatch 원문 대신 운영 화면에 필요한 필드만 공개한다. 없는 값은 null이다.
public record AdminLogEntry(
        Instant timestamp,
        String requestId,
        String httpMethod,
        String path,
        Long memberId,
        Integer status,
        Long durationMs,
        String message,
        String errorType,
        String exceptionType,
        String errorMessage,
        String stackTrace
) {
}
