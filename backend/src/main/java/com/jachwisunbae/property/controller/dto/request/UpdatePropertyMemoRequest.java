package com.jachwisunbae.property.controller.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "자유 메모 교체 요청")
public record UpdatePropertyMemoRequest(
    @Schema(description = "교체할 자유 메모. 빈 문자열이면 메모를 비운다", example = "채광이 좋고 역과 가깝다",
        requiredMode = Schema.RequiredMode.REQUIRED, maxLength = 2000)
    @NotNull(message = "자유 메모는 null일 수 없습니다.")
    @Size(max = 2000, message = "자유 메모는 최대 2000자까지 입력할 수 있습니다.")
    String freeMemo
) {
}
