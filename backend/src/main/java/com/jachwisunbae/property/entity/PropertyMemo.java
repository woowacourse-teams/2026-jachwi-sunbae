package com.jachwisunbae.property.entity;

import com.jachwisunbae.common.exception.client.InvalidInputException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;

record PropertyMemo(String value) {

    PropertyMemo {
        value = validateMemo(value);
    }

    public static PropertyMemo from(String value) {
        return new PropertyMemo(value);
    }

    private static String validateMemo(final String memo) {
        String value = validateEmpty(memo);
        if (value.length() > 2000) {
            throw new InvalidInputException(ErrorCode.PROPERTY_MEMO_INVALID, "자유 메모는 2,000자 이하여야 합니다.");
        }
        return value;
    }

    private static String validateEmpty(final String memo) {
        if (memo == null) {
            return "";
        }
        return memo;
    }
}
