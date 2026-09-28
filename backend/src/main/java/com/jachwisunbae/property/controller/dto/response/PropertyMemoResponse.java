package com.jachwisunbae.property.controller.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "매물 자유 메모 응답")
public record PropertyMemoResponse(
    @Schema(description = "매물 ID", example = "1")
    Long propertyId,

    @Schema(description = "저장된 자유 메모. 작성되지 않은 경우 빈 문자열", example = "채광이 좋고 역과 가깝다")
    String freeMemo
) {
    public static PropertyMemoResponse of(final Long propertyId, final String freeMemo) {
        return new PropertyMemoResponse(propertyId, freeMemo);
    }
}
