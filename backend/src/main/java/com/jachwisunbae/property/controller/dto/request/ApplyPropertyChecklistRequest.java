package com.jachwisunbae.property.controller.dto.request;

import com.jachwisunbae.property.type.PropertyChecklistSourceType;
import jakarta.validation.constraints.NotNull;

public record ApplyPropertyChecklistRequest(@NotNull PropertyChecklistSourceType sourceType, Long checklistId) {
}
