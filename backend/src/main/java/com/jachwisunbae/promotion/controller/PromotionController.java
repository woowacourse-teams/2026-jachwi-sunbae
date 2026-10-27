package com.jachwisunbae.promotion.controller;

import com.jachwisunbae.common.web.ApiResponse;
import com.jachwisunbae.common.web.error.ErrorResponse;
import com.jachwisunbae.promotion.controller.dto.response.PromotionProductsResponse;
import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.service.PromotionQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/promotions")
@Tag(name = "Promotions", description = "편의점 행사상품 조회")
@SecurityRequirement(name = "bearerAuth")
public class PromotionController {

    private final PromotionQueryService service;

    public PromotionController(final PromotionQueryService service) {
        this.service = service;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "브랜드별 행사상품 전체 조회", description = "DB에 저장된 해당 브랜드의 전체 상품을 저장 순서로 반환합니다. "
            + "외부 수집을 실행하지 않습니다. 미수집 브랜드는 빈 목록과 collectedAt=null을 반환합니다. "
            + "collectedAt은 +09:00 오프셋을 포함한 KST 시각입니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "전체 목록 또는 빈 목록 조회 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "brand 누락 또는 잘못된 enum 값",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "JWT 누락 또는 유효하지 않은 토큰",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "DB 조회 등 서버 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ApiResponse<PromotionProductsResponse> findByBrand(
            @Parameter(description = "조회할 브랜드(enum 이름, 대문자)", required = true, example = "EMART24")
            @RequestParam final ConvenienceBrand brand) {
        return ApiResponse.of(PromotionProductsResponse.from(service.findByBrand(brand)));
    }
}
