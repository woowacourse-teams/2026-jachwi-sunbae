package com.jachwisunbae.property.controller.dto.response;

import com.jachwisunbae.property.entity.Property;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;

public record UpdatePropertyResponse(
    Long id,
    String name,
    Long depositAmount,
    Long monthlyRentAmount,
    String discoverySource,
    String address,
    BigDecimal latitude,
    BigDecimal longitude,
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
            property.getUpdatedAt().toInstant(ZoneOffset.UTC)
        );
    }
}
