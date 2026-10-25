package com.jachwisunbae.rental.service;

import com.jachwisunbae.rental.domain.AdminDongRents;
import com.jachwisunbae.rental.domain.RecentRentalPeriod;
import com.jachwisunbae.rental.repository.JdbcAdminDongRentRepository;
import com.jachwisunbae.rental.repository.JdbcAdminLegalDongRepository;
import java.time.Clock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

// 생활권 탐색 결과에 붙일 행정동별 월세 시세다. 노선망처럼 서버가 뜰 때 한 번 계산해 메모리에 두고,
// 월세 수집본이나 관할 법정동 연결을 다시 적재하면 서버를 재시작해야 반영된다. 기간은 계산 시점 기준 최근 6개월이다.
// 계산하지 못하면 시세 없이 응답한다.
@Service
public class AdminDongRentService {

    private static final Logger LOG = LoggerFactory.getLogger(AdminDongRentService.class);

    private final JdbcAdminLegalDongRepository adminLegalDongRepository;
    private final JdbcAdminDongRentRepository rentRepository;
    private final Clock clock;
    private volatile AdminDongRents rents;

    public AdminDongRentService(final JdbcAdminLegalDongRepository adminLegalDongRepository,
                                final JdbcAdminDongRentRepository rentRepository, final Clock clock) {
        this.adminLegalDongRepository = adminLegalDongRepository;
        this.rentRepository = rentRepository;
        this.clock = clock;
    }

    public AdminDongRents findRents() {
        AdminDongRents loaded = rents;
        if (loaded != null) {
            return loaded;
        }
        synchronized (this) {
            if (rents == null) {
                rents = calculate();
            }
            return rents;
        }
    }

    private AdminDongRents calculate() {
        try {
            RecentRentalPeriod period = RecentRentalPeriod.of(clock);
            return AdminDongRents.of(adminLegalDongRepository.findAll(),
                rentRepository.findPrices(period.startDate(), period.endDate()), period.startDate(), period.endDate());
        } catch (RuntimeException exception) {
            LOG.warn("행정동 월세 시세를 계산하지 못해 시세 없이 응답합니다. 재시작하면 다시 계산합니다. reason={}",
                exception.getMessage());
            return AdminDongRents.empty();
        }
    }
}
