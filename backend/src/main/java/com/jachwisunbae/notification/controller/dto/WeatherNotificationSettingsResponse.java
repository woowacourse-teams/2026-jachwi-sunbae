package com.jachwisunbae.notification.controller.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public record WeatherNotificationSettingsResponse(
        @Schema(description = "회원 수신 동의. 서버 스케줄러 활성화와는 별개이며 기본 false") boolean enabled,
        @Schema(description = "서버가 이 회원의 등록 기기에 테스트 발송을 허용하는지 여부") boolean testAvailable) { }
