package com.jachwisunbae.deliverydiscount.controller;

import com.jachwisunbae.common.web.ApiResponse;
import com.jachwisunbae.deliverydiscount.controller.dto.response.DeliveryDiscountOfferResponse;
import com.jachwisunbae.deliverydiscount.service.DeliveryDiscountOfferQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/delivery-discount-offers")
@Tag(name = "Delivery Discount Offers", description = "배달 플랫폼 할인정보")
@SecurityRequirement(name = "bearerAuth")
public class DeliveryDiscountOfferController {

    private final DeliveryDiscountOfferQueryService service;

    public DeliveryDiscountOfferController(final DeliveryDiscountOfferQueryService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "현재 유효한 배달 할인정보 전체 조회",
            description = "활성화되어 있고 KST 오늘 날짜가 행사 기간(시작일·종료일 당일 포함)에 속하는 할인정보를 "
                    + "id 순으로 모두 반환합니다. 모르는 날짜는 기간 조건에서 제외합니다. "
                    + "필터·페이지네이션 없이 전체를 반환하며, 없으면 빈 목록입니다. 401 인증 오류.")
    public ApiResponse<List<DeliveryDiscountOfferResponse>> findAvailable() {
        return ApiResponse.of(service.findAvailable().stream().map(DeliveryDiscountOfferResponse::from).toList());
    }
}
