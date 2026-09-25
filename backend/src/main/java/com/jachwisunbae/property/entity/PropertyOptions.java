package com.jachwisunbae.property.entity;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.common.validation.DomainPreconditions;
import com.jachwisunbae.property.type.RoomOption;
import com.jachwisunbae.property.type.UtilityOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public record PropertyOptions(
    LocalDate availableMoveInDate,
    Long maintenanceFeeAmount,
    LocalDateTime visitScheduledAt,
    Set<RoomOption> roomOptions,
    Set<UtilityOption> utilityOptions,
    String discoverySource
) {

    public static PropertyOptions of(
            LocalDate availableMoveInDate,
            Long maintenanceFeeAmount,
            LocalDateTime visitScheduledAt,
            Set<RoomOption> roomOptions,
            Set<UtilityOption> utilityOptions,
            String discoverySource) {
        return new PropertyOptions(
            availableMoveInDate,
            validateAmount(maintenanceFeeAmount),
            visitScheduledAt,
            roomOptions,
            utilityOptions,
            validateSource(discoverySource)
        );
    }

    public static PropertyOptions fromCodes(
        LocalDate availableMoveInDate,
        Long maintenanceFeeAmount,
        LocalDateTime visitScheduledAt,
        List<String> roomOptionCodes,
        List<String> utilityOptionCodes,
        String discoverySource
    ) {
        return new PropertyOptions(
            availableMoveInDate,
            validateAmount(maintenanceFeeAmount),
            visitScheduledAt,
            parseRoomOptions(roomOptionCodes),
            parseUtilityOptions(utilityOptionCodes),
            validateSource(discoverySource)
        );
    }

    private static Set<RoomOption> parseRoomOptions(final List<String> roomOptions) {
        if (roomOptions == null) {
            return Set.of();
        }
        return roomOptions.stream()
            .map(PropertyOptions::parseRoomOption)
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
            .map(PropertyOptions::parseUtilityOption)
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

    private static String validateSource(final String source) {
        if (source == null) {
            return "";
        }
        DomainPreconditions.require(source.length() <= 500, DomainErrorCode.PROPERTY_INPUT_INVALID,
            "발견 경로는 500자 이하여야 합니다.");
        return source;
    }
}
