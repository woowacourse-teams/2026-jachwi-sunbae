package com.jachwisunbae.common.exception;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode code;

    public BusinessException(ErrorCode code, String debugMessage) {
        super(debugMessage);
        this.code = code;
    }

    public BusinessException(ErrorCode code, String debugMessage, Throwable cause) {
        super(debugMessage, cause);
        this.code = code;
    }
}
