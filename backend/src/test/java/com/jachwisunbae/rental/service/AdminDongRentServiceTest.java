package com.jachwisunbae.rental.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.jachwisunbae.rental.domain.AdminDongRents;
import com.jachwisunbae.rental.domain.AdminLegalDong;
import com.jachwisunbae.rental.domain.RentalPricePoint;
import com.jachwisunbae.rental.repository.JdbcAdminDongRentRepository;
import com.jachwisunbae.rental.repository.JdbcAdminLegalDongRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;

class AdminDongRentServiceTest {

    private final JdbcAdminLegalDongRepository adminLegalDongRepository = mock(JdbcAdminLegalDongRepository.class);
    private final JdbcAdminDongRentRepository rentRepository = mock(JdbcAdminDongRentRepository.class);
    // 한국 시각 2026-10-25 12:00
    private final AdminDongRentService service = new AdminDongRentService(adminLegalDongRepository, rentRepository,
        Clock.fixed(Instant.parse("2026-10-25T03:00:00Z"), ZoneOffset.UTC));

    @BeforeEach
    void setUp() {
        given(adminLegalDongRepository.findAll())
            .willReturn(List.of(new AdminLegalDong("11230640", "1168010100", "역삼동")));
        given(rentRepository.findPrices(any(), any())).willReturn(Collections.nCopies(5,
            new RentalPricePoint("1168010100", 780_000, 10_000_000)));
    }

    @Test
    @DisplayName("거래 목록과 같은 최근 6개월 거래로 시세를 한 번 계산하고 이후에는 다시 계산하지 않는다")
    void calculatesOnce() {
        AdminDongRents rents = service.findRents();

        assertThat(service.findRents()).isSameAs(rents);
        assertThat(rents.find("11230640").orElseThrow().monthlyRentKrw()).isEqualTo(780_000);
        assertThat(rents.queryStartDate()).isEqualTo(LocalDate.of(2026, 4, 25));
        assertThat(rents.queryEndDate()).isEqualTo(LocalDate.of(2026, 10, 25));
        verify(rentRepository, times(1)).findPrices(LocalDate.of(2026, 4, 25), LocalDate.of(2026, 10, 25));
    }

    @Test
    @DisplayName("시세를 계산하지 못하면 시세 없이 응답한다")
    void respondsWithoutRentsOnFailure() {
        given(rentRepository.findPrices(any(), any())).willThrow(new DataAccessResourceFailureException("DB 연결 실패"));

        assertThat(service.findRents().isEmpty()).isTrue();
    }
}
