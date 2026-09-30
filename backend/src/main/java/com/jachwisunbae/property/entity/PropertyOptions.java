package com.jachwisunbae.property.entity;

import com.jachwisunbae.common.exception.client.InvalidInputException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.property.type.RoomOption;
import com.jachwisunbae.property.type.UtilityOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

record PropertyOptions(
    LocalDate availableMoveInDate,
    Long maintenanceFeeAmount,
    LocalDateTime visitScheduledAt,
    Set<RoomOption> roomOptions,
    Set<UtilityOption> utilityOptions,
    String discoverySource
) {

    PropertyOptions {
        maintenanceFeeAmount = validateAmount(maintenanceFeeAmount);
        roomOptions = roomOptions == null ? Set.of() : Set.copyOf(roomOptions);
        utilityOptions = utilityOptions == null ? Set.of() : Set.copyOf(utilityOptions);
        discoverySource = validateSource(discoverySource);
    }

    public static PropertyOptions of(
            LocalDate availableMoveInDate,
            Long maintenanceFeeAmount,
            LocalDateTime visitScheduledAt,
            Set<RoomOption> roomOptions,
            Set<UtilityOption> utilityOptions,
            String discoverySource) {
        return new PropertyOptions(
            availableMoveInDate,
            maintenanceFeeAmount,
            visitScheduledAt,
            roomOptions,
            utilityOptions,
            discoverySource
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
            maintenanceFeeAmount,
            visitScheduledAt,
            parseRoomOptions(roomOptionCodes),
            parseUtilityOptions(utilityOptionCodes),
            discoverySource
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
        if (code == null) {
            throw new InvalidInputException(ErrorCode.PROPERTY_INPUT_INVALID, "방 옵션 값이 비어 있습니다.");
        }
        try {
            return RoomOption.valueOf(code);
        } catch (IllegalArgumentException exception) {
            throw new InvalidInputException(ErrorCode.PROPERTY_INPUT_INVALID,
                "지원하지 않는 방 옵션입니다: " + code, exception);
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
        if (code == null) {
            throw new InvalidInputException(ErrorCode.PROPERTY_INPUT_INVALID, "관리비 포함 공과금 값이 비어 있습니다.");
        }
        try {
            return UtilityOption.valueOf(code);
        } catch (IllegalArgumentException exception) {
            throw new InvalidInputException(ErrorCode.PROPERTY_INPUT_INVALID,
                "지원하지 않는 관리비 포함 공과금입니다: " + code, exception);
        }
    }

    private static Long validateAmount(final Long amount) {
        if (amount == null) {
            return 0L;
        }
        if (amount < 0) {
            throw new InvalidInputException(ErrorCode.PROPERTY_INPUT_INVALID, "금액은 0 이상의 정수여야 합니다.");
        }
        return amount;
    }

    private static String validateSource(final String source) {
        if (source == null) {
            return "";
        }
        if (source.length() > 500) {
            throw new InvalidInputException(ErrorCode.PROPERTY_INPUT_INVALID, "발견 경로는 500자 이하여야 합니다.");
        }
        return source;
    }
}
