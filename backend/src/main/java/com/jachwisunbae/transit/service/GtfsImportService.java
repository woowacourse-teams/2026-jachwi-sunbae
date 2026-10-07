package com.jachwisunbae.transit.service;

import com.jachwisunbae.transit.domain.GtfsFeed;
import com.jachwisunbae.transit.provider.gtfs.GtfsFeedReader;
import com.jachwisunbae.transit.repository.GtfsNetworkRepository;
import com.jachwisunbae.transit.service.dto.result.GtfsImportResult;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class GtfsImportService {

    private final String directory;
    private final GtfsFeedReader feedReader;
    private final GtfsNetworkRepository networkRepository;
    private final TransactionTemplate transactionTemplate;

    public GtfsImportService(@Value("${transit.gtfs.directory:}") final String directory,
                             final GtfsFeedReader feedReader,
                             final GtfsNetworkRepository networkRepository,
                             final TransactionTemplate transactionTemplate) {
        this.directory = directory;
        this.feedReader = feedReader;
        this.networkRepository = networkRepository;
        this.transactionTemplate = transactionTemplate;
    }

    // 전국 GTFS는 파일을 읽는 데 수십 초가 걸려 DB 커넥션을 오래 잡지 않도록 읽은 뒤 교체만 트랜잭션으로 묶는다.
    public GtfsImportResult importFeed() {
        GtfsFeed feed = feedReader.read(feedDirectory());
        transactionTemplate.executeWithoutResult(status -> networkRepository.replace(feed));
        return new GtfsImportResult(feed.routes().size(), feed.stops().size(),
                feed.edges().size(), feed.transfers().size());
    }

    // 빈 경로는 Path.of("")가 현재 디렉터리를 가리켜 디렉터리 검사를 통과하므로 따로 막는다.
    private Path feedDirectory() {
        if (directory.isBlank() || !Files.isDirectory(Path.of(directory))) {
            throw new IllegalStateException("GTFS_DIRECTORY가 GTFS 파일이 있는 디렉터리가 아닙니다: " + directory);
        }
        return Path.of(directory);
    }
}
