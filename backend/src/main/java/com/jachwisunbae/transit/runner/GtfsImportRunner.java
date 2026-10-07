package com.jachwisunbae.transit.runner;

import com.jachwisunbae.transit.service.GtfsImportService;
import com.jachwisunbae.transit.service.dto.result.GtfsImportResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

// 노선망 적재는 무겁고 자주 하지 않는 운영 작업이라 공개 API 대신 기동 옵션으로만 실행한다.
@Component
@ConditionalOnProperty(name = "transit.gtfs.import-on-startup", havingValue = "true")
public class GtfsImportRunner implements ApplicationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(GtfsImportRunner.class);

    private final GtfsImportService gtfsImportService;

    public GtfsImportRunner(final GtfsImportService gtfsImportService) {
        this.gtfsImportService = gtfsImportService;
    }

    @Override
    public void run(final ApplicationArguments arguments) {
        GtfsImportResult result = gtfsImportService.importFeed();
        LOG.atInfo()
                .addKeyValue("event_type", "gtfs_import_completed")
                .addKeyValue("route_count", result.routeCount())
                .addKeyValue("stop_count", result.stopCount())
                .addKeyValue("edge_count", result.edgeCount())
                .addKeyValue("transfer_count", result.transferCount())
                .log("GTFS network imported");
    }
}
