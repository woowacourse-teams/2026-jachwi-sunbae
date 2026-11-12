package com.jachwisunbae.admin.service;

import com.jachwisunbae.admin.repository.JdbcAdminQueryRepository;
import com.jachwisunbae.admin.repository.query.AdminMember;
import java.util.List;
import com.jachwisunbae.admin.repository.query.AdminSummary;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminQueryService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private final JdbcAdminQueryRepository repository;
    private final Clock clock;

    public AdminQueryService(JdbcAdminQueryRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    public AdminSummary summary() {
        LocalDate today = LocalDate.now(clock.withZone(KST));
        LocalDateTime start = today.atStartOfDay(KST).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
        LocalDateTime end = today.plusDays(1).atStartOfDay(KST).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
        return repository.summary(start, end);
    }

    public List<AdminMember> recentMembers() {
        return repository.recentMembers();
    }
}
