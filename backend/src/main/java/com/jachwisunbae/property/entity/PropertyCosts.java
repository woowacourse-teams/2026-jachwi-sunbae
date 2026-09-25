package com.jachwisunbae.property.entity;

import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.common.validation.DomainPreconditions;

record PropertyCosts(
    Long depositAmount,
    Long monthlyRentAmount
) {

    PropertyCosts {
        depositAmount = validateAmount(depositAmount);
        monthlyRentAmount = validateAmount(monthlyRentAmount);
    }

    public static PropertyCosts from(Long depositAmount, Long monthlyRentAmount) {
        return new PropertyCosts(validateAmount(depositAmount), validateAmount(monthlyRentAmount));
    }

    private static Long validateAmount(final Long amount) {
        if (amount == null) {
            return 0L;
        }
        return DomainPreconditions.requireNonNegative(amount, DomainErrorCode.PROPERTY_INPUT_INVALID,
            "금액은 0 이상의 정수여야 합니다.");
    }
}
