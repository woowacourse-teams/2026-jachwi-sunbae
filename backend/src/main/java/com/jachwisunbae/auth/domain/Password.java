package com.jachwisunbae.auth.domain;

import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.common.validation.DomainPreconditions;
import java.nio.charset.StandardCharsets;

// 로그인할 때 입력한 비밀번호. 앞뒤 공백도 비밀번호의 일부로 보고 입력한 그대로 검사한다.
public record Password(String value) {

    private static final int MIN_LENGTH = 4;
    private static final int MAX_LENGTH = 30;
    // BCrypt는 72바이트를 넘는 비밀번호를 받지 않는다 (Spring Security가 예외를 던진다).
    private static final int BCRYPT_MAX_BYTES = 72;

    public Password {
        DomainPreconditions.requireNonNull(value, DomainErrorCode.NICKNAME_PASSWORD_INVALID, "비밀번호가 필요합니다.");
        DomainPreconditions.require(value.length() >= MIN_LENGTH && value.length() <= MAX_LENGTH
                        && value.getBytes(StandardCharsets.UTF_8).length <= BCRYPT_MAX_BYTES,
                DomainErrorCode.NICKNAME_PASSWORD_INVALID,
                "비밀번호는 4자 이상 30자 이하이고 UTF-8 72바이트 이하여야 합니다.");
    }

    public static Password from(String value) {
        return new Password(value);
    }
}
