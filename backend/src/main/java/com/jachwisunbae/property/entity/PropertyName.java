package com.jachwisunbae.property.entity;

import com.jachwisunbae.common.exception.client.InvalidInputException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;

record PropertyName(String value) {

    private static final int MAX_LENGTH = 30;

    PropertyName {
        value = validateName(value);
    }

    static PropertyName from(String value) {
        return new PropertyName(value);
    }

    private static String validateName(String value) {
        if (value == null || value.isBlank() || value.trim().length() > MAX_LENGTH) {
            throw new InvalidInputException(ErrorCode.PROPERTY_INPUT_INVALID,
                "매물 이름은 trim 후 1자 이상 30자 이하여야 합니다.");
        }
        return value.trim();
    }
}
