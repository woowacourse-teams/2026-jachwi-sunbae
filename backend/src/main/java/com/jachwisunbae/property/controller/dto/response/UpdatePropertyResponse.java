package com.jachwisunbae.property.controller.dto.response;

import com.jachwisunbae.property.entity.Property;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

public record UpdatePropertyResponse(
    Long id,
    String name,
    Long depositAmount,
    Long monthlyRentAmount,
    String discoverySource,
    String address,
    BigDecimal latitude,
    BigDecimal longitude,
    LocalDate availableMoveInDate,
    Long maintenanceFeeAmount,
    LocalDateTime visitScheduledAt,
    List<String> roomOptions,
    List<String> utilityOptions,
    Instant updatedAt
) {
    public static UpdatePropertyResponse from(final Property property) {
        return new UpdatePropertyResponse(
            property.getId(),
            property.getName(),
            property.getDepositAmount(),
            property.getMonthlyRentAmount(),
            property.getDiscoverySource(),
            property.getAddress(),
            property.getLatitude(),
            property.getLongitude(),
            property.getAvailableMoveInDate(),
            property.getMaintenanceFeeAmount(),
            property.getVisitScheduledAt(),
            property.getRoomOptions().stream().sorted().map(Enum::name).toList(),
            property.getUtilityOptions().stream().sorted().map(Enum::name).toList(),
            property.getUpdatedAt().toInstant(ZoneOffset.UTC)
        );
    }
}
