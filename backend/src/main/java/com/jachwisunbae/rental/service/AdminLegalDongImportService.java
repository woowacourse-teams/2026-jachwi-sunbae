package com.jachwisunbae.rental.service;

import com.jachwisunbae.rental.domain.AdminLegalDong;
import com.jachwisunbae.rental.importer.KikMixMatcher;
import com.jachwisunbae.rental.repository.JdbcAdminDongRentRepository;
import com.jachwisunbae.transit.domain.AdminDong;
import com.jachwisunbae.transit.repository.AdminDongRepository;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 행정기관·관할구역 연계표(KIKmix)로 적재된 행정동과 관할 법정동의 연결을 전체 교체하고,
// 이미 적재된 월세 거래로 행정동 시세를 다시 계산한다. 행정동 경계를 먼저 적재해야 한다.
@Service
public class AdminLegalDongImportService {

    private static final Logger LOG = LoggerFactory.getLogger(AdminLegalDongImportService.class);

    private final String file;
    private final AdminDongRepository adminDongRepository;
    private final JdbcAdminDongRentRepository rentRepository;

    public AdminLegalDongImportService(@Value("${transit.admin-legal-dong.file:}") final String file,
                                       final AdminDongRepository adminDongRepository,
                                       final JdbcAdminDongRentRepository rentRepository) {
        this.file = file;
        this.adminDongRepository = adminDongRepository;
        this.rentRepository = rentRepository;
    }

    public boolean hasFile() {
        return !file.isBlank();
    }

    @Transactional
    public int importLinks() {
        List<AdminDong> adminDongs = adminDongRepository.findAll();
        List<LocalDate> baseDates = adminDongs.stream().map(AdminDong::baseDate).distinct().toList();
        if (baseDates.size() != 1) {
            throw new IllegalStateException("행정동 경계를 먼저 적재해야 관할 법정동을 이을 수 있습니다. baseDates=" + baseDates);
        }
        List<AdminLegalDong> links = match(adminDongs, baseDates.getFirst());
        if (links.isEmpty()) {
            throw new IllegalStateException("관할 법정동을 하나도 잇지 못했습니다. 연계표 파일을 확인해 주세요: " + file);
        }
        rentRepository.replaceLinks(links);
        rentRepository.refresh();
        Set<String> linked = links.stream().map(AdminLegalDong::adminDongCode).collect(Collectors.toSet());
        adminDongs.stream().filter(adminDong -> !linked.contains(adminDong.code())).forEach(adminDong ->
            LOG.warn("연계표에서 찾지 못한 행정동입니다. code={}, name={}", adminDong.code(), adminDong.fullName()));
        return links.size();
    }

    private List<AdminLegalDong> match(final List<AdminDong> adminDongs, final LocalDate baseDate) {
        try {
            return KikMixMatcher.match(adminDongs, Path.of(file), baseDate);
        } catch (IOException exception) {
            throw new UncheckedIOException("행정기관·관할구역 연계표를 읽지 못했습니다: " + file, exception);
        }
    }
}
