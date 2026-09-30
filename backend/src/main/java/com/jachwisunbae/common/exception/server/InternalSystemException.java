package com.jachwisunbae.common.exception.server;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;

// 외부 시스템과 관계없는 서버 내부 작업이 실패했다. (500)
public class InternalSystemException extends ServerException {

    public InternalSystemException(ErrorCode errorCode, String debugMessage) {
        super(errorCode, debugMessage);
    }

    public InternalSystemException(ErrorCode errorCode, String debugMessage, Throwable cause) {
        super(errorCode, debugMessage, cause);
    }
}
