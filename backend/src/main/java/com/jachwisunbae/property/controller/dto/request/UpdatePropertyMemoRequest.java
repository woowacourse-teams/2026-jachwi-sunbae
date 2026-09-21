package com.jachwisunbae.property.controller.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdatePropertyMemoRequest(
    @NotNull(message = "자유 메모는 null일 수 없습니다.")
    @Size(max = 2000, message = "자유 메모는 최대 2000자까지 입력할 수 있습니다.")
    String freeMemo
) {
}
