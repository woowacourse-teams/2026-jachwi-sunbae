package com.jachwisunbae.common.exception.client;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;

// 사용자가 보낸 값이 허용하는 형식이나 범위를 만족하지 않는다. (400)
public class InvalidInputException extends ClientException {

    public InvalidInputException(ErrorCode errorCode, String debugMessage) {
        super(errorCode, debugMessage);
    }

    public InvalidInputException(ErrorCode errorCode, String debugMessage, Throwable cause) {
        super(errorCode, debugMessage, cause);
    }
}
