package com.jachwisunbae.notification.controller;

import com.jachwisunbae.auth.web.AuthenticatedMemberId;
import com.jachwisunbae.common.web.ApiResponse;
import com.jachwisunbae.notification.config.WeatherPushTestPolicy;
import com.jachwisunbae.notification.service.WeatherNotificationSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@ConditionalOnProperty(name = "weather.notification.test-enabled", havingValue = "true")
@RestController
@Tag(name = "Weather notifications")
@SecurityRequirement(name = "bearerAuth")
public class WeatherNotificationTestController {
    private final WeatherNotificationSettingsService service;
    private final WeatherPushTestPolicy policy;

    public WeatherNotificationTestController(final WeatherNotificationSettingsService service, final WeatherPushTestPolicy policy) {
        this.service = service;
        this.policy = policy;
    }

    @PostMapping("/api/members/me/weather-notifications/test")
    @Operation(summary = "내 기기로 테스트 알림 즉시 발송", description = "test-enabled일 때만 노출. prod에서는 서버에 지정한 설치 한 대만 허용합니다. "
            + "등록된 기기로 고정 문구를 바로 보내며 이력은 저장하지 않습니다. "
            + "sent=false는 기기 미등록 또는 발송 실패·비활성화입니다. 401 인증 오류, 404 MEMBER_NOT_FOUND.")
    public ApiResponse<TestPushResponse> send(@AuthenticatedMemberId final Long memberId) {
        if (!policy.enabled()) {
            return ApiResponse.of(new TestPushResponse(false));
        }
        return ApiResponse.of(new TestPushResponse(service.sendTest(memberId, policy.installationId())));
    }

    public record TestPushResponse(boolean sent) {
    }
}
