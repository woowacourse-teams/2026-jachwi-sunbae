package com.jachwisunbae.property.entity;

import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.common.validation.DomainPreconditions;
import java.math.BigDecimal;

record PropertyLocation(
    String address,
    BigDecimal latitude,
    BigDecimal longitude
) {

    PropertyLocation {
        address = validateAddress(address);
        validateLocation(latitude, longitude);
    }

    public static PropertyLocation from(String address, BigDecimal latitude, BigDecimal longitude) {
        return new PropertyLocation(address, latitude, longitude);
    }

    private static String validateAddress(final String address) {
        if (address == null || address.isBlank()) {
            return null;
        }
        DomainPreconditions.require(address.length() <= 255, DomainErrorCode.PROPERTY_INPUT_INVALID,
            "주소는 255자 이하여야 합니다.");
        return address;
    }

    private static void validateLocation(final BigDecimal latitude, final BigDecimal longitude) {
        DomainPreconditions.require((latitude == null) == (longitude == null),
            DomainErrorCode.PROPERTY_LOCATION_INVALID, "위도와 경도는 함께 입력해야 합니다.");
        if (latitude == null) {
            return;
        }
        DomainPreconditions.require(latitude.compareTo(BigDecimal.valueOf(-90)) >= 0
                && latitude.compareTo(BigDecimal.valueOf(90)) <= 0,
            DomainErrorCode.PROPERTY_LOCATION_INVALID, "위도 범위가 올바르지 않습니다.");
        DomainPreconditions.require(longitude.compareTo(BigDecimal.valueOf(-180)) >= 0
                && longitude.compareTo(BigDecimal.valueOf(180)) <= 0,
            DomainErrorCode.PROPERTY_LOCATION_INVALID, "경도 범위가 올바르지 않습니다.");
    }
}
