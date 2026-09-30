package com.jachwisunbae.common.exception.client;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;

// 사용자의 인증 정보를 확인할 수 없다. (401)
public class AuthenticationFailedException extends ClientException {

    public AuthenticationFailedException(ErrorCode errorCode, String debugMessage) {
        super(errorCode, debugMessage);
    }

    public AuthenticationFailedException(ErrorCode errorCode, String debugMessage, Throwable cause) {
        super(errorCode, debugMessage, cause);
    }
}
