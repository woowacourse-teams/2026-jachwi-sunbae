package com.jachwisunbae.admin.controller;

import com.jachwisunbae.admin.service.AdminLogService;
import com.jachwisunbae.admin.service.result.AdminLogQuery;
import com.jachwisunbae.common.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/log-queries")
@Tag(name = "Admin logs", description = "Authorization: Admin <접속 코드>가 필요한 CloudWatch 로그 조회")
public class AdminLogController {

    private final AdminLogService service;

    public AdminLogController(AdminLogService service) {
        this.service = service;
    }

    @PostMapping
    @Operation(summary = "로그 조회 시작", description = "environment: dev/prod, period: 1h/24h/7d, status: all/4xx/5xx. "
            + "선택 requestId는 영문·숫자·밑줄·하이픈 1~128자이며 지정하면 상태 필터 없이 요청 상세를 조회합니다. "
            + "최대 100건, 실행 제한 60초. 200 Scheduled와 서버 조회 ID를 반환하며 logs는 null입니다. "
            + "잘못된 입력 400, 인증 실패 401, 등록 한도 503. AWS 권한·그룹 누락·서비스 오류·시간 초과는 502와 "
            + "ADMIN_LOG_ACCESS_DENIED/GROUP_NOT_FOUND/UNAVAILABLE/QUERY_TIMEOUT 코드로 구분합니다.")
    public ResponseEntity<ApiResponse<AdminLogQuery>> start(
            @RequestParam String environment,
            @RequestParam String period,
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(required = false) String requestId) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(ApiResponse.of(service.start(environment, period, status, requestId)));
    }

    @GetMapping("/{queryId}")
    @Operation(summary = "로그 조회 상태와 결과", description = "서버가 발급한 조회 ID만 허용하며 5분 후 만료됩니다. "
            + "Scheduled/Running은 logs=null이며 같은 ID로 다시 확인합니다. Complete만 logs 배열을 반환합니다. "
            + "오류 목록은 최신순, 상세는 시간순 최대 100건. 없는 필드는 null. "
            + "인증 실패 401, 미등록·만료 ID 404. AWS Failed/Cancelled/Timeout은 502와 각각 "
            + "ADMIN_LOG_QUERY_FAILED/CANCELLED/TIMEOUT으로 구분합니다. AWS 오류 원문은 반환하지 않습니다.")
    public ResponseEntity<ApiResponse<AdminLogQuery>> results(@PathVariable String queryId) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(ApiResponse.of(service.results(queryId)));
    }
}
