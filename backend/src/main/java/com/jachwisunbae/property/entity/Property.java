package com.jachwisunbae.property.entity;

import com.jachwisunbae.common.entity.BaseTimeEntity;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.common.validation.DomainPreconditions;
import com.jachwisunbae.property.type.RoomOption;
import com.jachwisunbae.property.type.UtilityOption;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import lombok.Getter;

@Getter
public class Property extends BaseTimeEntity {

    private final Long id;
    private final Long memberId;
    private PropertyName propertyName;
    private PropertyCosts propertyCosts;
    private PropertyLocation propertyLocation;
    private PropertyOptions propertyOptions;

    private Property(final Long id, final Long memberId, final PropertyName propertyName,
                     final PropertyCosts propertyCosts, final PropertyLocation propertyLocation,
                     final PropertyOptions propertyOptions,
                     final LocalDateTime createdAt, final LocalDateTime updatedAt) {
        super(createdAt, updatedAt);
        this.id = id;
        this.memberId = memberId;
        this.propertyName = propertyName;
        this.propertyCosts = propertyCosts;
        this.propertyLocation = propertyLocation;
        this.propertyOptions = propertyOptions;
    }

    public static Property create(final Long memberId, final String name, final Long depositAmount,
                                  final Long monthlyRentAmount,
                                  final String address, final BigDecimal latitude,
                                  final BigDecimal longitude, final LocalDate availableMoveInDate,
                                  final Long maintenanceFeeAmount, final LocalDateTime visitScheduledAt,
                                  final List<String> roomOptions, final List<String> utilityOptions,
                                  final String discoverySource,
                                  final LocalDateTime now) {
        return new Property(null, validateMemberId(memberId), PropertyName.from(name),
            PropertyCosts.from(depositAmount, monthlyRentAmount),
            PropertyLocation.from(address, latitude, longitude),
            PropertyOptions.fromCodes(availableMoveInDate, maintenanceFeeAmount, visitScheduledAt, roomOptions,
                utilityOptions, discoverySource),
            now, now);
    }

    public static Property reconstruct(final Long id, final Long memberId, final String name,
                                       final Long depositAmount, final Long monthlyRentAmount,
                                       final String address,
                                       final BigDecimal latitude, final BigDecimal longitude,
                                       final LocalDate availableMoveInDate, final Long maintenanceFeeAmount,
                                       final LocalDateTime visitScheduledAt,
                                       final Set<RoomOption> roomOptions, final Set<UtilityOption> utilityOptions,
                                       final String discoverySource,
                                       final LocalDateTime createdAt, final LocalDateTime updatedAt) {
        return new Property(id, validateMemberId(memberId), PropertyName.from(name),
            PropertyCosts.from(depositAmount, monthlyRentAmount),
            PropertyLocation.from(address, latitude, longitude),
            PropertyOptions.of(availableMoveInDate, maintenanceFeeAmount, visitScheduledAt, roomOptions, utilityOptions,
                discoverySource),
            createdAt, updatedAt);
    }

    public void replaceBasicInfo(final String name, final Long depositAmount, final Long monthlyRentAmount,
                                 final String address,
                                 final BigDecimal latitude, final BigDecimal longitude,
                                 final LocalDate availableMoveInDate, final Long maintenanceFeeAmount,
                                 final LocalDateTime visitScheduledAt,
                                 final List<String> roomOptions, final List<String> utilityOptions,
                                 final String discoverySource,
                                 final LocalDateTime now) {
        this.propertyName = PropertyName.from(name);
        this.propertyCosts = PropertyCosts.from(depositAmount, monthlyRentAmount);
        this.propertyLocation = PropertyLocation.from(address, latitude, longitude);
        this.propertyOptions = PropertyOptions.fromCodes(availableMoveInDate, maintenanceFeeAmount, visitScheduledAt,
            roomOptions, utilityOptions, discoverySource);
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

    public LocalDate getAvailableMoveInDate() {
        return propertyOptions.availableMoveInDate();
    }

    public Long getMaintenanceFeeAmount() {
        return propertyOptions.maintenanceFeeAmount();
    }

    public LocalDateTime getVisitScheduledAt() {
        return propertyOptions.visitScheduledAt();
    }

    public Set<RoomOption> getRoomOptions() {
        return propertyOptions.roomOptions();
    }

    public Set<UtilityOption> getUtilityOptions() {
        return propertyOptions.utilityOptions();
    }

    public String getDiscoverySource() {
        return propertyOptions.discoverySource();
    }

    private static Long validateMemberId(final Long memberId) {
        return DomainPreconditions.requireNonNull(memberId, DomainErrorCode.PROPERTY_INPUT_INVALID,
            "매물 소유 회원은 필수입니다.");
    }
}
