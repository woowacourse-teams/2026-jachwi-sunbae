package com.jachwisunbae.auth.domain;

import com.jachwisunbae.common.exception.client.InvalidInputException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;

// 로그인할 때 입력한 비밀번호. 앞뒤 공백도 비밀번호의 일부로 보고 입력한 그대로 검사한다.
//TODO 비밀번호 관련 정책
public record Password(String value) {

    private static final int MIN_LENGTH = 4;
    private static final int MAX_LENGTH = 30;

    public Password {
        if (value == null || value.length() < MIN_LENGTH || value.length() > MAX_LENGTH) {
            throw new InvalidInputException(ErrorCode.NICKNAME_PASSWORD_INVALID,
                    "비밀번호는 4자 이상 30자 이하여야 합니다.");
        }
    }

    public static Password from(String value) {
        return new Password(value);
    }
}
