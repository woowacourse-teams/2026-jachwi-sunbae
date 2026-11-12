package com.jachwisunbae.admin.service;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.jachwisunbae.admin.repository.JdbcAdminQueryRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AdminQueryServiceTest {

    @Test
    @DisplayName("KST 자정의 오늘을 UTC의 반열린 구간으로 조회한다")
    void usesKstDay() {
        var repository = mock(JdbcAdminQueryRepository.class);
        var service = new AdminQueryService(repository, Clock.fixed(Instant.parse("2026-11-11T15:00:00Z"), ZoneOffset.UTC));
        service.summary();
        verify(repository).summary(LocalDateTime.parse("2026-11-11T15:00:00"), LocalDateTime.parse("2026-11-12T15:00:00"));
    }

}
