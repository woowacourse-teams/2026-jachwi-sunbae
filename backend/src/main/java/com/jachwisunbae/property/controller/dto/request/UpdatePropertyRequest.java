package com.jachwisunbae.property.controller.dto.request;

import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record UpdatePropertyRequest(
    @Schema(description = "매물 이름", example = "신림역 원룸")
    @NotBlank
    @Size(max = 30)
    String name,

    @Schema(description = "보증금(원). 미확정이면 0", example = "10000000")
    @NotNull
    @PositiveOrZero
    Long depositAmount,

    @Schema(description = "월세(원). 미확정이면 0", example = "550000")
    @NotNull
    @PositiveOrZero
    Long monthlyRentAmount,

    @Schema(description = "주소. 도로명·지번 구분 없는 단일 값. 비우면 좌표도 함께 제거된다",
        example = "서울 관악구 신림로 12길 3")
    @Size(max = 255)
    String address,

    @Schema(description = "위도. longitude와 함께 있거나 함께 없어야 한다", example = "37.4841234")
    BigDecimal latitude,

    @Schema(description = "경도. latitude와 함께 있거나 함께 없어야 한다", example = "126.9291234")
    BigDecimal longitude,

    @Schema(description = "입주 가능일")
    LocalDate availableMoveInDate,

    @Schema(description = "관리비(원)", example = "70000")
    @PositiveOrZero
    Long maintenanceFeeAmount,

    @Schema(description = "방문 예정 시각")
    LocalDateTime visitScheduledAt,

    @Schema(description = "발견 경로(URL·중개사 연락처 등)", example = "https://example.com/rooms/123")
    @Size(max = 500)
    String discoverySource,

    @ArraySchema(schema = @Schema(description = "방 옵션",
        allowableValues = {"AIR_CONDITIONER", "REFRIGERATOR", "WASHING_MACHINE", "SINK", "GAS_STOVE",
            "MICROWAVE", "SHOE_CABINET", "WARDROBE", "BED", "DESK", "TV", "INDUCTION"}))
    List<String> roomOptions,

    @ArraySchema(schema = @Schema(description = "관리비 포함 공과금",
        allowableValues = {"WATER", "ELECTRICITY", "GAS", "INTERNET"}))
    List<String> utilityOptions
) {
}
