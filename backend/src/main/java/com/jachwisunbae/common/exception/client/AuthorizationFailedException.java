package com.jachwisunbae.common.exception.client;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;

// 인증은 되었지만 요청한 작업을 수행할 권한이 없다. (403)
public class AuthorizationFailedException extends ClientException {

    public AuthorizationFailedException(ErrorCode errorCode, String debugMessage) {
        super(errorCode, debugMessage);
    }

    public AuthorizationFailedException(ErrorCode errorCode, String debugMessage, Throwable cause) {
        super(errorCode, debugMessage, cause);
    }
}
