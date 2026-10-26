package com.jachwisunbae.rental.service;

import com.jachwisunbae.rental.domain.AdminDongRents;
import com.jachwisunbae.rental.repository.JdbcAdminDongRentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

// 적재할 때 계산해 둔 행정동별 월세 시세를 서버가 뜰 때 읽어 메모리에 둔다.
// 시세를 다시 적재하면 서버를 재시작해야 반영되고, 읽지 못하면 시세 없이 응답한다.
@Service
public class AdminDongRentService {

    private static final Logger LOG = LoggerFactory.getLogger(AdminDongRentService.class);

    private final JdbcAdminDongRentRepository rentRepository;
    private volatile AdminDongRents rents = AdminDongRents.empty();

    public AdminDongRentService(final JdbcAdminDongRentRepository rentRepository) {
        this.rentRepository = rentRepository;
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
