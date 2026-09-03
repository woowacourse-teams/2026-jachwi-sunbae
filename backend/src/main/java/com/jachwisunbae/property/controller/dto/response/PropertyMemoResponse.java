package com.jachwisunbae.property.controller.dto.response;

import com.jachwisunbae.property.entity.PropertyMemo;

public record PropertyMemoResponse(
    Long propertyId,
    String freeMemo
) {
    public static PropertyMemoResponse from(final PropertyMemo memo) {
        return new PropertyMemoResponse(
            memo.getPropertyId(),
            memo.getFreeMemo() == null ? "" : memo.getFreeMemo()
        );
    }
}
