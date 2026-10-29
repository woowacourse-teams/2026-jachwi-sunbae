package com.jachwisunbae.transit.controller;

import com.jachwisunbae.common.web.ApiResponse;
import com.jachwisunbae.transit.controller.dto.request.CommuteAreaSearchRequest;
import com.jachwisunbae.transit.controller.dto.request.CommuteRouteRequest;
import com.jachwisunbae.transit.controller.dto.response.CommuteAreaSearchResponse;
import com.jachwisunbae.transit.controller.dto.response.CommuteRentAreaSearchResponse;
import com.jachwisunbae.transit.controller.dto.response.CommuteRouteResponse;
import com.jachwisunbae.transit.service.CommuteAreaService;
import com.jachwisunbae.transit.service.CommuteRouteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/commute-areas")
@Tag(name = "Commute Areas", description = "목적지 기반 생활권 탐색 API")
public class CommuteAreaController {

    private final CommuteAreaService commuteAreaService;
    private final CommuteRouteService commuteRouteService;

    public CommuteAreaController(final CommuteAreaService commuteAreaService,
                                 final CommuteRouteService commuteRouteService) {
        this.commuteAreaService = commuteAreaService;
        this.commuteRouteService = commuteRouteService;
    }

    @Deprecated
    @GetMapping
    @Operation(summary = "생활권 탐색 (사용 중단)", deprecated = true, description = "목적지까지 대중교통으로 최대 통근 시간 안에 "
            + "갈 수 있는 동네를 행정동 코드별 정류장과 함께 조회합니다. 동네 월세 시세가 함께 필요하면 "
            + "GET /api/commute-areas/with-rents를 사용합니다. 응답 형식은 바꾸지 않고 유지합니다.")
    public ApiResponse<CommuteAreaSearchResponse> search(
            @Valid @ModelAttribute final CommuteAreaSearchRequest request) {
        return ApiResponse.of(CommuteAreaSearchResponse.from(commuteAreaService.search(request.destination(),
                request.maxMinutes(), request.maxTransfers())));
    }

    @GetMapping("/with-rents")
    @Operation(summary = "시세를 포함한 생활권 탐색", description = "생활권 탐색 결과의 동네마다 관할 법정동의 월세 "
            + "실거래를 합친 시세(월세·보증금 중앙값, 거래 수)를 함께 조회합니다. 기간은 수집된 거래의 마지막 계약일부터 "
            + "6개월이고, 거래가 5건보다 적은 동네는 금액과 거래 수가 null입니다.")
    public ApiResponse<CommuteRentAreaSearchResponse> searchWithRents(
            @Valid @ModelAttribute final CommuteAreaSearchRequest request) {
        return ApiResponse.of(CommuteRentAreaSearchResponse.from(commuteAreaService.searchWithRents(
                request.destination(), request.maxMinutes(), request.maxTransfers())));
    }

    @GetMapping("/route")
    @Operation(summary = "상세 경로", description = "생활권 탐색 결과의 정류장에서 목적지까지 타고 갈 노선과 "
            + "걷는 구간을 순서대로 조회합니다.")
    public ApiResponse<CommuteRouteResponse> findRoute(@Valid @ModelAttribute final CommuteRouteRequest request) {
        return ApiResponse.of(CommuteRouteResponse.from(commuteRouteService.findRoute(request.stopId(),
                request.destination(), request.maxMinutes(), request.maxTransfers())));
    }
}
