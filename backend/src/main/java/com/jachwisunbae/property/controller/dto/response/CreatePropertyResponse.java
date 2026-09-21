package com.jachwisunbae.property.controller.dto.response;

import com.jachwisunbae.property.entity.Property;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
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

    @ArraySchema(schema = @Schema(description = "방 옵션",
        allowableValues = {"AIR_CONDITIONER", "REFRIGERATOR", "WASHING_MACHINE", "SINK", "GAS_STOVE",
            "MICROWAVE", "SHOE_CABINET", "WARDROBE", "BED", "DESK", "TV", "INDUCTION"}))
    List<String> roomOptions,

    @ArraySchema(schema = @Schema(description = "관리비 포함 공과금",
        allowableValues = {"WATER", "ELECTRICITY", "GAS", "INTERNET"}))
    List<String> utilityOptions,

    Instant createdAt,

    @Schema(description = "created_at과 항상 같은 값. property_details는 별도 수정 시각을 두지 않는다")
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
