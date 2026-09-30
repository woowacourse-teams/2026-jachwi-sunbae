package com.jachwisunbae.common.exception.client;

import com.jachwisunbae.common.exception.JachwiException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;

// 사용자가 요청을 수정하거나 다른 요청을 보내면 해결할 수 있는 실패.
public abstract class ClientException extends JachwiException {

    protected ClientException(ErrorCode errorCode, String debugMessage) {
        super(errorCode, debugMessage);
    }

    protected ClientException(ErrorCode errorCode, String debugMessage, Throwable cause) {
        super(errorCode, debugMessage, cause);
    }
}
