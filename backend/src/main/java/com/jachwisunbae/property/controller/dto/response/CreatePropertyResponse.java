package com.jachwisunbae.property.controller.dto.response;

import com.jachwisunbae.property.entity.Property;
import java.math.BigDecimal;
import java.time.Instant;
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
    Instant createdAt,
    Instant updatedAt,
    List<Object> photos,
    PropertyCreateProgress overallProgress,
    boolean firstProperty
) {
    public static CreatePropertyResponse from(final Property property, final boolean firstProperty) {
        return new CreatePropertyResponse(
            property.getId(),
            property.getName(),
            property.getDepositAmount(),
            property.getMonthlyRentAmount(),
            property.getDiscoverySource(),
            property.getAddress(),
            property.getLatitude(),
            property.getLongitude(),
            property.getCreatedAt().toInstant(ZoneOffset.UTC),
            property.getUpdatedAt().toInstant(ZoneOffset.UTC),
            List.of(),
            new PropertyCreateProgress(0, 0, 0, 0, 0, 0),
            firstProperty
        );
    }
}
