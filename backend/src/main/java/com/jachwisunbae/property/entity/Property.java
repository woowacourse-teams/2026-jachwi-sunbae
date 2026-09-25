package com.jachwisunbae.property.entity;

import com.jachwisunbae.common.entity.BaseTimeEntity;
import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.common.validation.DomainPreconditions;
import com.jachwisunbae.property.type.RoomOption;
import com.jachwisunbae.property.type.UtilityOption;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.Getter;

@Getter
public class Property extends BaseTimeEntity {

    private final Long id;
    private final Long memberId;
    private PropertyName propertyName;
    private PropertyCosts propertyCosts;
    private PropertyLocation propertyLocation;
    private LocalDate availableMoveInDate;
    private Long maintenanceFeeAmount;
    private LocalDateTime visitScheduledAt;
    private Set<RoomOption> roomOptions;
    private Set<UtilityOption> utilityOptions;
    private String discoverySource;

    private Property(final Long id, final Long memberId, final PropertyName propertyName,
                     final PropertyCosts propertyCosts, final PropertyLocation propertyLocation, final LocalDate availableMoveInDate, final Long maintenanceFeeAmount,
                     final LocalDateTime visitScheduledAt,
                     final Set<RoomOption> roomOptions, final Set<UtilityOption> utilityOptions,
                     final String discoverySource,
                     final LocalDateTime createdAt, final LocalDateTime updatedAt) {
        super(createdAt, updatedAt);
        this.id = id;
        this.memberId = memberId;
        this.propertyName = propertyName;
        this.propertyCosts = propertyCosts;
        this.propertyLocation = propertyLocation;
        this.availableMoveInDate = availableMoveInDate;
        this.maintenanceFeeAmount = maintenanceFeeAmount;
        this.visitScheduledAt = visitScheduledAt;
        this.roomOptions = roomOptions;
        this.utilityOptions = utilityOptions;
        this.discoverySource = discoverySource;
    }

    public static Property create(final Long memberId, final String name, final Long depositAmount,
                                  final Long monthlyRentAmount, final String discoverySource,
                                  final String address, final BigDecimal latitude,
                                  final BigDecimal longitude, final LocalDate availableMoveInDate,
                                  final Long maintenanceFeeAmount, final LocalDateTime visitScheduledAt,
                                  final List<String> roomOptions, final List<String> utilityOptions,
                                  final LocalDateTime now) {
        return new Property(null, validateMemberId(memberId), PropertyName.from(name), PropertyCosts.from(depositAmount, monthlyRentAmount),
            PropertyLocation.from(address, latitude, longitude),
            availableMoveInDate, validateAmount(maintenanceFeeAmount), visitScheduledAt,
            parseRoomOptions(roomOptions), parseUtilityOptions(utilityOptions), validateSource(discoverySource), now, now);
    }

    public static Property reconstruct(final Long id, final Long memberId, final String name,
                                       final Long depositAmount, final Long monthlyRentAmount,
                                       final String discoverySource, final String address,
                                       final BigDecimal latitude, final BigDecimal longitude,
                                       final LocalDate availableMoveInDate, final Long maintenanceFeeAmount,
                                       final LocalDateTime visitScheduledAt,
                                       final Set<RoomOption> roomOptions, final Set<UtilityOption> utilityOptions,
                                       final LocalDateTime createdAt, final LocalDateTime updatedAt) {
        return new Property(id, validateMemberId(memberId), PropertyName.from(name), PropertyCosts.from(depositAmount, monthlyRentAmount),
            PropertyLocation.from(address, latitude, longitude), availableMoveInDate, validateAmount(maintenanceFeeAmount), visitScheduledAt,
            roomOptions == null ? Set.of() : roomOptions, utilityOptions == null ? Set.of() : utilityOptions, validateSource(discoverySource),
            createdAt, updatedAt);
    }

    public void replaceBasicInfo(final String name, final Long depositAmount, final Long monthlyRentAmount,
                                 final String discoverySource, final String address,
                                 final BigDecimal latitude, final BigDecimal longitude,
                                 final LocalDate availableMoveInDate, final Long maintenanceFeeAmount,
                                 final LocalDateTime visitScheduledAt,
                                 final List<String> roomOptions, final List<String> utilityOptions,
                                 final LocalDateTime now) {
        this.propertyName = PropertyName.from(name);
        this.propertyCosts = PropertyCosts.from(depositAmount, monthlyRentAmount);
        this.discoverySource = validateSource(discoverySource);
        this.propertyLocation = PropertyLocation.from(address, latitude, longitude);
        this.availableMoveInDate = availableMoveInDate;
        this.maintenanceFeeAmount = validateAmount(maintenanceFeeAmount);
        this.visitScheduledAt = visitScheduledAt;
        this.roomOptions = parseRoomOptions(roomOptions);
        this.utilityOptions = parseUtilityOptions(utilityOptions);
        updateUpdatedAt(DomainPreconditions.requireNonNull(now, DomainErrorCode.PROPERTY_INPUT_INVALID,
            "변경 시각은 필수입니다."));
    }

    public String getName() {
        return propertyName.value();
    }

    public Long getDepositAmount() {
        return propertyCosts.depositAmount();
    }

    public Long getMonthlyRentAmount() {
        return propertyCosts.monthlyRentAmount();
    }

    public String getAddress() {
        return propertyLocation.address();
    }

    public BigDecimal getLatitude() {
        return propertyLocation.latitude();
    }

    public BigDecimal getLongitude() {
        return propertyLocation.longitude();
    }

    private static Long validateMemberId(final Long memberId) {
        return DomainPreconditions.requireNonNull(memberId, DomainErrorCode.PROPERTY_INPUT_INVALID,
            "매물 소유 회원은 필수입니다.");
    }

    private static String validateSource(final String source) {
        if (source == null) {
            return "";
        }
        DomainPreconditions.require(source.length() <= 500, DomainErrorCode.PROPERTY_INPUT_INVALID,
            "발견 경로는 500자 이하여야 합니다.");
        return source;
    }

    private static Set<RoomOption> parseRoomOptions(final List<String> roomOptions) {
        if (roomOptions == null) {
            return Set.of();
        }
        return roomOptions.stream()
            .map(Property::parseRoomOption)
            .collect(Collectors.toUnmodifiableSet());
    }

    private static RoomOption parseRoomOption(final String code) {
        try {
            return RoomOption.valueOf(code);
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw new BusinessException(DomainErrorCode.PROPERTY_INPUT_INVALID,
                "지원하지 않는 방 옵션입니다: " + code);
        }
    }

    private static Set<UtilityOption> parseUtilityOptions(final List<String> utilityOptions) {
        if (utilityOptions == null) {
            return Set.of();
        }
        return utilityOptions.stream()
            .map(Property::parseUtilityOption)
            .collect(Collectors.toUnmodifiableSet());
    }

    private static UtilityOption parseUtilityOption(final String code) {
        try {
            return UtilityOption.valueOf(code);
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw new BusinessException(DomainErrorCode.PROPERTY_INPUT_INVALID,
                "지원하지 않는 관리비 포함 공과금입니다: " + code);
        }
    }

    private static Long validateAmount(final Long amount) {
        if (amount == null) {
            return 0L;
        }
        return DomainPreconditions.requireNonNegative(amount, DomainErrorCode.PROPERTY_INPUT_INVALID,
            "금액은 0 이상의 정수여야 합니다.");
    }
}
