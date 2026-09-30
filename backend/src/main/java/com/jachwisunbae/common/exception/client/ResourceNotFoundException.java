package com.jachwisunbae.common.exception.client;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;

// 요청한 리소스를 찾을 수 없다. 다른 회원의 리소스도 존재를 드러내지 않도록 이 예외를 쓴다. (404)
public class ResourceNotFoundException extends ClientException {

    public ResourceNotFoundException(ErrorCode errorCode, String debugMessage) {
        super(errorCode, debugMessage);
    }

    public ResourceNotFoundException(ErrorCode errorCode, String debugMessage, Throwable cause) {
        super(errorCode, debugMessage, cause);
    }
}
