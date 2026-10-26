package com.jachwisunbae.rental.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import com.jachwisunbae.rental.domain.AdminDongRent;
import com.jachwisunbae.rental.domain.AdminDongRents;
import com.jachwisunbae.rental.repository.JdbcAdminDongRentRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;

class AdminDongRentServiceTest {

    private final JdbcAdminDongRentRepository rentRepository = mock(JdbcAdminDongRentRepository.class);
    private final AdminDongRentService service = new AdminDongRentService(rentRepository);

    @Test
    @DisplayName("서버가 뜰 때 저장된 시세를 읽어 둔다")
    void loadsStoredRents() {
        AdminDongRents rents = new AdminDongRents(LocalDate.of(2026, 3, 30), LocalDate.of(2026, 9, 30),
            Map.of("11230640", new AdminDongRent("11230640", List.of("역삼동"), 780_000, 10_000_000, 5)));
        given(rentRepository.findAll()).willReturn(rents);

        service.load();

        assertThat(service.findRents()).isSameAs(rents);
    }

    @Test
    @DisplayName("시세를 읽지 못하면 시세 없이 응답한다")
    void respondsWithoutRentsOnFailure() {
        given(rentRepository.findAll()).willThrow(new DataAccessResourceFailureException("DB 연결 실패"));

        service.load();

        assertThat(service.findRents().byAdminDong()).isEmpty();
    }
}
