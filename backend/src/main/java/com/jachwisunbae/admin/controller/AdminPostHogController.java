package com.jachwisunbae.admin.controller;

import com.jachwisunbae.admin.service.AdminPostHogService;
import com.jachwisunbae.admin.service.result.AdminPostHogResult;
import com.jachwisunbae.common.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/posthog-errors")
@Tag(name = "Admin PostHog", description = "Authorization: Admin <접속 코드>로 조회하는 프론트엔드 오류")
public class AdminPostHogController {
    private final AdminPostHogService service;

    public AdminPostHogController(AdminPostHogService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "PostHog 예외 이벤트 조회", description = "environment: dev/prod, period: 1h/24h/7d, "
            + "severity: all/P0/P1/P2, 선택 requestId: 영문·숫자·밑줄·하이픈 1~128자. 최신 100건. "
            + "없는 속성은 null, memberId는 정확한 member-{양의 정수} distinct_id에서만 추출합니다. "
            + "200: 완료, 400: 잘못된 조건, 401: 관리자 인증 실패, 503 ADMIN_POSTHOG_NOT_CONFIGURED: 키 미설정. "
            + "PostHog 인증·권한·429·시간 초과·서비스 오류는 502와 ADMIN_POSTHOG_AUTH_FAILED/ACCESS_DENIED/"
            + "RATE_LIMITED/TIMEOUT/UNAVAILABLE 코드로 구분합니다. 키·원본 이벤트·HogQL은 반환하지 않습니다.")
    public ResponseEntity<ApiResponse<AdminPostHogResult>> search(
            @RequestParam String environment, @RequestParam String period,
            @RequestParam(defaultValue = "all") String severity, @RequestParam(required = false) String requestId) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(ApiResponse.of(service.search(environment, period, severity, requestId)));
    }
}
