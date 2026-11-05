package com.jachwisunbae.streetmemo.domain;

import com.jachwisunbae.common.exception.client.InvalidInputException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;

public enum StreetMemoCategory {
    PLACE,
    STREET,
    GENERAL;

    // 카테고리는 선택 값이라 보내지 않으면 GENERAL로 둔다.
    public static StreetMemoCategory fromCode(final String code) {
        if (code == null) {
            return GENERAL;
        }
        for (StreetMemoCategory category : values()) {
            if (category.name().equals(code)) {
                return category;
            }
        }
        throw new InvalidInputException(ErrorCode.STREET_MEMO_CATEGORY_INVALID,
                "거리 메모 카테고리는 PLACE, STREET, GENERAL 중 하나여야 합니다.");
    }
}
