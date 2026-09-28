package com.jachwisunbae.property.entity;

import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.common.validation.DomainPreconditions;

record PropertyMemo(String value) {

    PropertyMemo {
        value = validateMemo(value);
    }

    public static PropertyMemo from(String value) {
        return new PropertyMemo(value);
    }

    private static String validateMemo(final String memo) {
        String value = (memo == null) ? "" : memo;
        DomainPreconditions.require(value.length() <= 2000, DomainErrorCode.PROPERTY_MEMO_INVALID,
                "자유 메모는 2,000자 이하여야 합니다.");
        return value;
    }
}
