package com.jachwisunbae.common.exception;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;

// 애플리케이션이 의미를 알고 처리하는 예외의 최상위 타입.
// 예외 타입은 실패의 분류(HTTP 상태)를, ErrorCode는 구체적인 실패 이유를 나타낸다.
// debugMessage는 로그에서 원인을 찾기 위한 값이며 응답에 쓰지 않는다.
public abstract class JachwiException extends RuntimeException {

    private final ErrorCode errorCode;

    protected JachwiException(ErrorCode errorCode, String debugMessage) {
        super(debugMessage);
        this.errorCode = errorCode;
    }

    protected JachwiException(ErrorCode errorCode, String debugMessage, Throwable cause) {
        super(debugMessage, cause);
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
