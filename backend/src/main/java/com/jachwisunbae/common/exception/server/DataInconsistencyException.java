package com.jachwisunbae.common.exception.server;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;

// DB에 저장된 데이터가 애플리케이션이 기대하는 상태를 만족하지 않는다. (500)
public class DataInconsistencyException extends ServerException {

    public DataInconsistencyException(ErrorCode errorCode, String debugMessage) {
        super(errorCode, debugMessage);
    }

    public DataInconsistencyException(ErrorCode errorCode, String debugMessage, Throwable cause) {
        super(errorCode, debugMessage, cause);
    }
}
