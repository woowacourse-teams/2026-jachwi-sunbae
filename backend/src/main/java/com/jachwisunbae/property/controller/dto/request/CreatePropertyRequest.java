package com.jachwisunbae.property.controller.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record CreatePropertyRequest(
    @NotBlank
    @Size(max = 30)
    String name,

    @NotNull
    @PositiveOrZero
    Long depositAmount,

    @NotNull
    @PositiveOrZero
    Long monthlyRentAmount,

    @Size(max = 255)
    String address,

    BigDecimal latitude,
    BigDecimal longitude,
    LocalDate availableMoveInDate,

    @PositiveOrZero
    Long maintenanceFeeAmount,

    LocalDateTime visitScheduledAt,

    @Size(max = 500)
    String discoverySource,

    List<String> roomOptions,
    List<String> utilityOptions
) {
}
