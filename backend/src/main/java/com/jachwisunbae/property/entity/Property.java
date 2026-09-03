package com.jachwisunbae.property.entity;

import lombok.Getter;
import com.jachwisunbae.common.entity.BaseTimeEntity;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.common.validation.DomainPreconditions;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
public class Property extends BaseTimeEntity {

    private final Long id;
    private final Long memberId;
    private String name;
    private Long depositAmount;
    private Long monthlyRentAmount;
    private String discoverySource;
    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;

    private Property(final Long id, final Long memberId, final String name,
                     final Long depositAmount, final Long monthlyRentAmount,
                     final String discoverySource, final String address,
                     final BigDecimal latitude, final BigDecimal longitude,
                     final LocalDateTime createdAt, final LocalDateTime updatedAt) {
        super(createdAt, updatedAt);
        this.id = id;
        this.memberId = memberId;
        this.name = name;
        this.depositAmount = depositAmount;
        this.monthlyRentAmount = monthlyRentAmount;
        this.discoverySource = discoverySource;
        this.address = address;
        validateLocation(latitude, longitude);
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public static Property create(final Long memberId, final String name, final Long depositAmount,
                                  final Long monthlyRentAmount, final String discoverySource,
                                  final String address, final BigDecimal latitude,
                                  final BigDecimal longitude, final LocalDateTime now) {
        return new Property(null, validateMemberId(memberId), validateName(name), validateAmount(depositAmount),
            validateAmount(monthlyRentAmount), validateSource(discoverySource), validateAddress(address),
            latitude, longitude, now, now);
    }

    public static Property reconstruct(final Long id, final Long memberId, final String name,
                                       final Long depositAmount, final Long monthlyRentAmount,
                                       final String discoverySource, final String address,
                                       final BigDecimal latitude, final BigDecimal longitude,
                                       final LocalDateTime createdAt, final LocalDateTime updatedAt) {
        return new Property(id, validateMemberId(memberId), validateName(name), validateAmount(depositAmount),
            validateAmount(monthlyRentAmount), validateSource(discoverySource), validateAddress(address),
            latitude, longitude, createdAt, updatedAt);
    }

    public void replaceBasicInfo(final String name, final Long depositAmount, final Long monthlyRentAmount,
                                 final String discoverySource, final String address,
                                 final BigDecimal latitude, final BigDecimal longitude,
                                 final LocalDateTime now) {
        this.name = validateName(name);
        this.depositAmount = validateAmount(depositAmount);
        this.monthlyRentAmount = validateAmount(monthlyRentAmount);
        this.discoverySource = validateSource(discoverySource);
        validateLocation(latitude, longitude);
        this.address = validateAddress(address);
        this.latitude = latitude;
        this.longitude = longitude;
        updateUpdatedAt(DomainPreconditions.requireNonNull(now, DomainErrorCode.PROPERTY_INPUT_INVALID,
            "변경 시각은 필수입니다."));
    }

    private static Long validateMemberId(final Long memberId) {
        return DomainPreconditions.requireNonNull(memberId, DomainErrorCode.PROPERTY_INPUT_INVALID,
            "매물 소유 회원은 필수입니다.");
    }

    private static String validateName(final String name) {
        return DomainPreconditions.requireTrimmed(name, 1, 30, DomainErrorCode.PROPERTY_INPUT_INVALID,
            "매물 이름은 trim 후 1자 이상 30자 이하여야 합니다.");
    }

    private static Long validateAmount(final Long amount) {
        if (amount == null) {
            return 0L;
        }
        return DomainPreconditions.requireNonNegative(amount, DomainErrorCode.PROPERTY_INPUT_INVALID,
            "보증금과 월세는 0 이상의 정수여야 합니다.");
    }

    private static String validateSource(final String source) {
        if (source == null) {
            return "";
        }
        DomainPreconditions.require(source.length() <= 500, DomainErrorCode.PROPERTY_INPUT_INVALID,
            "발견 경로는 500자 이하여야 합니다.");
        return source;
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
