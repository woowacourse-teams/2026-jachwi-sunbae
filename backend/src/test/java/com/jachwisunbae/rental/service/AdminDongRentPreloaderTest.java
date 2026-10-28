package com.jachwisunbae.rental.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;

class AdminDongRentPreloaderTest {

    @Test
    @DisplayName("시세를 읽지 못해도 서버 기동을 막지 않는다")
    void keepsStartingOnFailure() {
        AdminDongRentService service = mock(AdminDongRentService.class);
        given(service.load()).willThrow(new DataAccessResourceFailureException("DB 연결 실패"));

        assertThatCode(() -> new AdminDongRentPreloader(service).preload()).doesNotThrowAnyException();
    }
}
