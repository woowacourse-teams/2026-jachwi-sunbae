package com.jachwisunbae.property.entity;

import com.jachwisunbae.common.exception.client.InvalidInputException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;
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
        if (address.length() > 255) {
            throw new InvalidInputException(ErrorCode.PROPERTY_INPUT_INVALID, "주소는 255자 이하여야 합니다.");
        }
        return address;
    }

    private static void validateLocation(final BigDecimal latitude, final BigDecimal longitude) {
        if ((latitude == null) != (longitude == null)) {
            throw invalidLocation("위도와 경도는 함께 입력해야 합니다.");
        }
        if (latitude == null) {
            return;
        }
        if (latitude.compareTo(BigDecimal.valueOf(-90)) < 0 || latitude.compareTo(BigDecimal.valueOf(90)) > 0) {
            throw invalidLocation("위도 범위가 올바르지 않습니다.");
        }
        if (longitude.compareTo(BigDecimal.valueOf(-180)) < 0 || longitude.compareTo(BigDecimal.valueOf(180)) > 0) {
            throw invalidLocation("경도 범위가 올바르지 않습니다.");
        }
    }

    private static InvalidInputException invalidLocation(final String debugMessage) {
        return new InvalidInputException(ErrorCode.PROPERTY_LOCATION_INVALID, debugMessage);
    }
}
