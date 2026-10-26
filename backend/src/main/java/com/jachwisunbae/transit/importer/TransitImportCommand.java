package com.jachwisunbae.transit.importer;

import com.jachwisunbae.JachwiSunbaeBackendApplication;
import com.jachwisunbae.rental.service.AdminLegalDongImportService;
import com.jachwisunbae.transit.service.AdminDongImportService;
import com.jachwisunbae.transit.service.GtfsImportService;
import com.jachwisunbae.transit.service.dto.result.GtfsImportResult;
import java.util.HashSet;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

// 행정동 경계와 GTFS 노선망, 행정동의 관할 법정동 연결을 순서대로 적재하는 일회성 도구다.
// 관할 법정동 연결(--transit.admin-legal-dong.file)은 생활권 동네 월세 시세에 쓰며, 넘기지 않으면 적재하지 않는다.
public class TransitImportCommand {

    private static final Logger LOG = LoggerFactory.getLogger(TransitImportCommand.class);
    private static final Set<String> OPTIONS = Set.of("transit.admin-dong.file", "transit.gtfs.directory");
    private static final String ADMIN_LEGAL_DONG_OPTION = "transit.admin-legal-dong.file";

    public static void main(final String[] arguments) {
        validateArguments(arguments);
        try (ConfigurableApplicationContext context = new SpringApplicationBuilder(JachwiSunbaeBackendApplication.class)
                .web(WebApplicationType.NONE)
                .run(arguments)) {
            importTransitData(context.getBean(AdminDongImportService.class), context.getBean(GtfsImportService.class),
                    context.getBean(AdminLegalDongImportService.class));
        }
    }

    static void importTransitData(final AdminDongImportService adminDongImportService,
                                  final GtfsImportService gtfsImportService,
                                  final AdminLegalDongImportService adminLegalDongImportService) {
        int adminDongCount = adminDongImportService.importBoundaries();
        LOG.info("행정동 경계를 적재했습니다. adminDongs={}", adminDongCount);

        GtfsImportResult gtfsResult = gtfsImportService.importFeed();
        LOG.info("GTFS 노선망을 적재했습니다. routes={}, stops={}, edges={}, transfers={}, matchedStops={}",
                gtfsResult.routeCount(), gtfsResult.stopCount(), gtfsResult.edgeCount(), gtfsResult.transferCount(),
                gtfsResult.matchedStopCount());

        if (adminLegalDongImportService.hasFile()) {
            LOG.info("행정동의 관할 법정동 연결과 월세 시세를 적재했습니다. links={}",
                    adminLegalDongImportService.importLinks());
        }
    }

    private static void validateArguments(final String[] arguments) {
        DefaultApplicationArguments args = new DefaultApplicationArguments(arguments);
        Set<String> names = new HashSet<>(args.getOptionNames());
        boolean hasAdminLegalDong = names.remove(ADMIN_LEGAL_DONG_OPTION);
        if (!OPTIONS.equals(names) || !args.getNonOptionArgs().isEmpty()) {
            throw new IllegalArgumentException("--transit.admin-dong.file과 --transit.gtfs.directory가 필요합니다. "
                    + "--transit.admin-legal-dong.file은 선택입니다.");
        }
        OPTIONS.forEach(option -> required(args, option));
        if (hasAdminLegalDong) {
            required(args, ADMIN_LEGAL_DONG_OPTION);
        }
    }

    private static String required(final DefaultApplicationArguments args, final String option) {
        var values = args.getOptionValues(option);
        if (values == null || values.size() != 1 || values.getFirst().isBlank()) {
            throw new IllegalArgumentException("필수 옵션 값이 필요합니다: --" + option);
        }
        return values.getFirst();
    }
}
