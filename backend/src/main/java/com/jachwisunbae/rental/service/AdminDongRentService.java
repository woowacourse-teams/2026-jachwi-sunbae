package com.jachwisunbae.rental.service;

import com.jachwisunbae.rental.domain.AdminDongRents;
import com.jachwisunbae.rental.repository.JdbcAdminDongRentRepository;
import java.time.LocalDate;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

// 행정동별 월세 시세를 다시 계산해 저장하고, 웹 서버가 뜰 때 저장된 시세를 읽어 메모리에 둔다.
// 다시 계산은 월세 거래나 관할 법정동 연결을 적재하는 트랜잭션 안에서 부른다.
// 다시 계산한 시세는 서버를 재시작해야 반영되고, 읽지 못하면 시세 없이 응답한다.
@Service
public class AdminDongRentService {

    private static final Logger LOG = LoggerFactory.getLogger(AdminDongRentService.class);

    private final JdbcAdminDongRentRepository rentRepository;
    private volatile AdminDongRents rents = AdminDongRents.empty();

    public AdminDongRentService(final JdbcAdminDongRentRepository rentRepository) {
        this.rentRepository = rentRepository;
    }

    // 적재된 월세 수집본의 마지막 계약일부터 6개월 동안의 거래로 시세를 전부 다시 계산한다.
    // 수집본이 없으면 시세를 비운다.
    public void refresh() {
        rentRepository.deleteRents();
        Optional<LocalDate> endDate = rentRepository.findRentEndDate();
        if (endDate.isEmpty()) {
            return;
        }
        LocalDate startDate = AdminDongRents.startDateOf(endDate.get());
        rentRepository.saveRents(AdminDongRents.calculate(rentRepository.findDeals(startDate, endDate.get())),
            startDate, endDate.get());
    }

    @EventListener(ApplicationReadyEvent.class)
    public void load() {
        try {
            rents = rentRepository.findAll();
        } catch (RuntimeException exception) {
            LOG.warn("행정동 월세 시세를 읽지 못해 시세 없이 응답합니다. reason={}", exception.getMessage());
        }
    }

    public AdminDongRents findRents() {
        return rents;
    }
}
