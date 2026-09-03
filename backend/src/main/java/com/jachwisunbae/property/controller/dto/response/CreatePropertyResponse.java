package com.jachwisunbae.property.controller.dto.response;

import com.jachwisunbae.property.entity.Property;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

public record CreatePropertyResponse(
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
    Instant createdAt,
    Instant updatedAt,
    List<Object> photos,
    PropertyCreateProgress overallProgress
) {
    public static CreatePropertyResponse from(final Property property) {
        return new CreatePropertyResponse(
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
            property.getCreatedAt().toInstant(ZoneOffset.UTC),
            property.getUpdatedAt().toInstant(ZoneOffset.UTC),
            List.of(),
            new PropertyCreateProgress(0, 0, 0, 0, 0, 0)
        );
    }
}
