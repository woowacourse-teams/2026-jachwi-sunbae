package com.jachwisunbae.common.web.error;

import java.util.List;

public record ErrorResponse(
        String code,
        String message,
        List<FieldErrorResponse> errors) {

    public ErrorResponse {
        errors = errors == null ? List.of() : List.copyOf(errors);
    }

    public ErrorResponse(final String code, final String message) {
        this(code, message, List.of());
    }
}
