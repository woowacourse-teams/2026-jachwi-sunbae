package com.jachwisunbae.common.exception.server;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;

// 의존하는 외부 시스템이 정상적인 결과를 주지 못했다. 외부 응답의 4xx도 사용자 잘못이 아니다. (502)
public class UpstreamServiceException extends ServerException {

    public UpstreamServiceException(ErrorCode errorCode, String debugMessage) {
        super(errorCode, debugMessage);
    }

    public UpstreamServiceException(ErrorCode errorCode, String debugMessage, Throwable cause) {
        super(errorCode, debugMessage, cause);
    }
}
