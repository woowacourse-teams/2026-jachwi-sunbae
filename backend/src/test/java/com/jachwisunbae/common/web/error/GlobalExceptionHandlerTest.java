package com.jachwisunbae.common.web.error;

import static org.assertj.core.api.Assertions.assertThat;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.JachwiException;
import com.jachwisunbae.common.exception.client.AuthenticationFailedException;
import com.jachwisunbae.common.exception.client.AuthorizationFailedException;
import com.jachwisunbae.common.exception.client.BusinessRuleViolationException;
import com.jachwisunbae.common.exception.client.InvalidInputException;
import com.jachwisunbae.common.exception.client.ResourceNotFoundException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.DataInconsistencyException;
import com.jachwisunbae.common.exception.server.InternalSystemException;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import java.util.stream.Stream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class GlobalExceptionHandlerTest {

    private static final String DEBUG_MESSAGE = "내부 원인 propertyId=7 errCd=-401";

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler(new DomainErrorHttpMapper());

    static Stream<Arguments> exceptionsAndStatuses() {
        ErrorCode code = ErrorCode.PROPERTY_NOT_FOUND;
        return Stream.of(
                Arguments.of(new InvalidInputException(code, DEBUG_MESSAGE), HttpStatus.BAD_REQUEST),
                Arguments.of(new BusinessRuleViolationException(code, DEBUG_MESSAGE), HttpStatus.BAD_REQUEST),
                Arguments.of(new AuthenticationFailedException(code, DEBUG_MESSAGE), HttpStatus.UNAUTHORIZED),
                Arguments.of(new AuthorizationFailedException(code, DEBUG_MESSAGE), HttpStatus.FORBIDDEN),
                Arguments.of(new ResourceNotFoundException(code, DEBUG_MESSAGE), HttpStatus.NOT_FOUND),
                Arguments.of(new DataInconsistencyException(code, DEBUG_MESSAGE), HttpStatus.INTERNAL_SERVER_ERROR),
                Arguments.of(new InternalSystemException(code, DEBUG_MESSAGE), HttpStatus.INTERNAL_SERVER_ERROR),
                Arguments.of(new UpstreamServiceException(code, DEBUG_MESSAGE), HttpStatus.BAD_GATEWAY));
    }

    @ParameterizedTest(name = "{0} → {1}")
    @MethodSource("exceptionsAndStatuses")
    @DisplayName("예외 타입으로 HTTP 상태를 정한다")
    void mapsExceptionTypeToStatus(JachwiException exception, HttpStatus status) {
        ResponseEntity<ErrorResponse> response = handler.handleJachwiException(exception);

        assertThat(response.getStatusCode()).isEqualTo(status);
    }

    @Test
    @DisplayName("응답에는 ErrorCode와 공개 메시지만 담고 debugMessage는 노출하지 않는다")
    void respondsWithPublicMessageOnly() {
        ResponseEntity<ErrorResponse> response = handler.handleJachwiException(
                new UpstreamServiceException(ErrorCode.MAP_PROVIDER_UNAVAILABLE, DEBUG_MESSAGE));

        assertThat(response.getBody()).isEqualTo(new ErrorResponse(ErrorCode.MAP_PROVIDER_UNAVAILABLE.name(),
                ErrorCode.MAP_PROVIDER_UNAVAILABLE.publicMessage()));
    }

    @Test
    @DisplayName("레거시 BusinessException은 ErrorCode마다 정한 상태와 공개 메시지로 응답한다")
    void respondsLegacyBusinessExceptionWithPublicMessage() {
        ResponseEntity<ErrorResponse> response = handler.handleBusinessException(
                new BusinessException(ErrorCode.PROPERTY_LIMIT_EXCEEDED, DEBUG_MESSAGE));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().message()).isEqualTo(ErrorCode.PROPERTY_LIMIT_EXCEEDED.publicMessage());
    }

    @Test
    @DisplayName("예상하지 못한 예외는 내부 정보 없이 500으로 응답한다")
    void respondsUnexpectedExceptionAsInternalServerError() {
        ResponseEntity<ErrorResponse> response = handler.handleUnexpectedException(
                new IllegalArgumentException(DEBUG_MESSAGE));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isEqualTo(new ErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR.name(),
                ErrorCode.INTERNAL_SERVER_ERROR.publicMessage()));
    }
}
