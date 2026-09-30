package com.jachwisunbae.common.exception.client;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;

// 요청 형식은 올바르지만 현재 제품 정책상 수행할 수 없다. (400)
public class BusinessRuleViolationException extends ClientException {

    public BusinessRuleViolationException(ErrorCode errorCode, String debugMessage) {
        super(errorCode, debugMessage);
    }

    public BusinessRuleViolationException(ErrorCode errorCode, String debugMessage, Throwable cause) {
        super(errorCode, debugMessage, cause);
    }
}
