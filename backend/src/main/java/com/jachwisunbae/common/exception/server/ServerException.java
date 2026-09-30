package com.jachwisunbae.common.exception.server;

import com.jachwisunbae.common.exception.JachwiException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;

// 사용자가 요청을 수정해도 해결할 수 없는 실패. 서버 코드, 데이터, 외부 시스템을 고쳐야 한다.
public abstract class ServerException extends JachwiException {

    protected ServerException(ErrorCode errorCode, String debugMessage) {
        super(errorCode, debugMessage);
    }

    protected ServerException(ErrorCode errorCode, String debugMessage, Throwable cause) {
        super(errorCode, debugMessage, cause);
    }
}
