package com.jachwisunbae.transit.controller;

import com.jachwisunbae.common.web.ApiResponse;
import com.jachwisunbae.transit.controller.dto.response.GtfsImportResponse;
import com.jachwisunbae.transit.service.GtfsImportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/gtfs-imports")
@Tag(name = "Transit", description = "대중교통 노선망 API")
@SecurityRequirement(name = "bearerAuth")
public class GtfsImportController {

    private final GtfsImportService gtfsImportService;

    public GtfsImportController(final GtfsImportService gtfsImportService) {
        this.gtfsImportService = gtfsImportService;
    }

    @PostMapping
    @Operation(summary = "GTFS 노선망 적재",
            description = "서버의 GTFS_DIRECTORY에 있는 KTDB GTFS 파일을 읽어 버스·지하철 노선망을 새로 적재합니다."
                    + " 기존 노선망은 모두 교체되며, 전국 데이터는 응답까지 수십 초 이상 걸릴 수 있습니다.")
    public ResponseEntity<ApiResponse<GtfsImportResponse>> importFeed() {
        GtfsImportResponse response = GtfsImportResponse.from(gtfsImportService.importFeed());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of("GTFS 노선망을 적재했습니다.", response));
    }
}
