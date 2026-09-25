package com.jachwisunbae.property.entity;

import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.common.validation.DomainPreconditions;

public record PropertyName(String value) {

    public static PropertyName from(final String value) {
        return new PropertyName(validateName(value));
    }

    private static String validateName(String value) {
        return DomainPreconditions.requireTrimmed(value, 1, 30, DomainErrorCode.PROPERTY_INPUT_INVALID,
            "매물 이름은 trim 후 1자 이상 30자 이하여야 합니다.");
    }
}
