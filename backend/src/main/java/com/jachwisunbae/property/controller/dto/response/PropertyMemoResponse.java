package com.jachwisunbae.property.controller.dto.response;

public record PropertyMemoResponse(
    Long propertyId,
    String freeMemo
) {
    public static PropertyMemoResponse of(final Long propertyId, final String freeMemo) {
        return new PropertyMemoResponse(propertyId, freeMemo);
    }
}
