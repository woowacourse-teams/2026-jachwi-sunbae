package com.jachwisunbae.transit.importer;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.jachwisunbae.rental.domain.AdminLegalDongMatcher;
import com.jachwisunbae.rental.service.AdminLegalDongImportService;
import com.jachwisunbae.transit.service.AdminDongImportService;
import com.jachwisunbae.transit.service.GtfsImportService;
import com.jachwisunbae.transit.service.dto.result.GtfsImportResult;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

class TransitImportCommandTest {

    private final AdminDongImportService adminDongImportService = mock(AdminDongImportService.class);
    private final GtfsImportService gtfsImportService = mock(GtfsImportService.class);
    private final AdminLegalDongImportService adminLegalDongImportService = mock(AdminLegalDongImportService.class);

    @BeforeEach
    void setUp() {
        when(adminDongImportService.importBoundaries()).thenReturn(1);
        when(gtfsImportService.importFeed()).thenReturn(new GtfsImportResult(1, 1, 1, 1, 1));
        when(adminLegalDongImportService.importLinks()).thenReturn(new AdminLegalDongMatcher.Result(List.of(), List.of()));
    }

    @Test
    @DisplayName("행정동 경계를 적재한 뒤 GTFS 노선망을, 연계표 파일이 있으면 마지막에 관할 법정동 연결을 적재한다")
    void importsAdminDongsBeforeGtfsNetwork() {
        when(adminLegalDongImportService.hasFile()).thenReturn(true);

        TransitImportCommand.importTransitData(adminDongImportService, gtfsImportService, adminLegalDongImportService);

        InOrder order = inOrder(adminDongImportService, gtfsImportService, adminLegalDongImportService);
        order.verify(adminDongImportService).importBoundaries();
        order.verify(gtfsImportService).importFeed();
        order.verify(adminLegalDongImportService).importLinks();
    }

    @Test
    @DisplayName("연계표 파일을 넘기지 않으면 관할 법정동 연결은 적재하지 않는다")
    void skipsAdminLegalDongsWithoutFile() {
        TransitImportCommand.importTransitData(adminDongImportService, gtfsImportService, adminLegalDongImportService);

        verify(adminLegalDongImportService, never()).importLinks();
    }
}
