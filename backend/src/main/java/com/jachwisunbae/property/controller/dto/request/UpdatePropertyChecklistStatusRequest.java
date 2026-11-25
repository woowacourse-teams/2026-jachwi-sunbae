package com.jachwisunbae.property.controller.dto.request;

import com.jachwisunbae.checklist.type.CheckStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record UpdatePropertyChecklistStatusRequest(@NotNull CheckStatus status, @NotNull @PositiveOrZero Long expectedVersion) {
}
