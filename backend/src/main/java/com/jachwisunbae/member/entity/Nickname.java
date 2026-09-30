package com.jachwisunbae.member.entity;

import com.jachwisunbae.common.exception.client.InvalidInputException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;

// 회원을 구분하는 닉네임. 앞뒤 공백만 제거하고 나머지는 입력한 그대로 쓴다.
public record Nickname(String value) {

    private static final int MIN_LENGTH = 1;
    private static final int MAX_LENGTH = 30;

    public Nickname {
        if (value == null) {
            throw invalid();
        }
        value = value.trim();
        if (value.length() < MIN_LENGTH || value.length() > MAX_LENGTH) {
            throw invalid();
        }
    }

    public static Nickname from(String value) {
        return new Nickname(value);
    }

    private static InvalidInputException invalid() {
        return new InvalidInputException(ErrorCode.NICKNAME_INVALID,
                "닉네임은 앞뒤 공백을 제거한 뒤 1자 이상 30자 이하여야 합니다.");
    }
}
