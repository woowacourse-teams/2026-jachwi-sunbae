package com.jachwisunbae.rental.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.jachwisunbae.rental.domain.AdminDongRents;
import com.jachwisunbae.rental.domain.vo.AdminDongDeal;
import com.jachwisunbae.rental.domain.vo.AdminDongRent;
import com.jachwisunbae.rental.repository.JdbcAdminDongRentRepository;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AdminDongRentServiceTest {

    private final JdbcAdminDongRentRepository rentRepository = mock(JdbcAdminDongRentRepository.class);
    private final AdminDongRentService service = new AdminDongRentService(rentRepository);

    @Test
    @DisplayName("[POL-COMMUTE-033] 서버가 뜰 때 저장된 시세를 읽어 둔다")
    void loadsStoredRents() {
        AdminDongRents rents = new AdminDongRents(LocalDate.of(2026, 3, 30), LocalDate.of(2026, 9, 30),
            Map.of("11230640", new AdminDongRent("11230640", List.of("역삼동"), 780_000, 10_000_000, 5)));
        given(rentRepository.findAll()).willReturn(rents);

        assertThat(service.load()).isEqualTo(1);
        assertThat(service.findRents()).isSameAs(rents);
    }

    @Test
    @DisplayName("[POL-COMMUTE-032·033] 수집본의 마지막 계약일부터 6개월 동안의 거래로 시세를 다시 계산해 저장한다")
    void refreshesWithDatasetPeriod() {
        LocalDate endDate = LocalDate.of(2026, 9, 30);
        LocalDate startDate = LocalDate.of(2026, 3, 30);
        given(rentRepository.findRentEndDate()).willReturn(Optional.of(endDate));
        given(rentRepository.findDeals(startDate, endDate)).willReturn(Collections.nCopies(5,
            new AdminDongDeal("11230640", "역삼동", 780_000, 10_000_000)));

        service.refresh();

        verify(rentRepository).deleteRents();
        verify(rentRepository).saveRents(
            List.of(new AdminDongRent("11230640", List.of("역삼동"), 780_000, 10_000_000, 5)), startDate, endDate);
    }

    @Test
    @DisplayName("[POL-COMMUTE-033] 적재된 월세 수집본이 없으면 시세를 비운다")
    void clearsWithoutDataset() {
        given(rentRepository.findRentEndDate()).willReturn(Optional.empty());

        service.refresh();

        verify(rentRepository).deleteRents();
        verify(rentRepository, never()).saveRents(any(), any(), any());
    }
}
