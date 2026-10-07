package com.jachwisunbae.transit.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jachwisunbae.transit.domain.Coordinate;
import com.jachwisunbae.transit.domain.GtfsFeed;
import com.jachwisunbae.transit.domain.GtfsRoute;
import com.jachwisunbae.transit.domain.GtfsStop;
import com.jachwisunbae.transit.domain.Seconds;
import com.jachwisunbae.transit.provider.gtfs.GtfsFeedReader;
import com.jachwisunbae.transit.repository.GtfsNetworkRepository;
import com.jachwisunbae.transit.service.dto.result.GtfsImportResult;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

class GtfsImportServiceTest {

    private static final GtfsFeed FEED = new GtfsFeed(
            List.of(new GtfsRoute("R1", "1호선", "서울 1호선", 1, new Seconds(300))),
            List.of(new GtfsStop("S1", "서울역", new Coordinate(37.55, 126.97)),
                    new GtfsStop("S2", "시청", new Coordinate(37.56, 126.97))),
            List.of(),
            List.of());

    @TempDir
    Path directory;

    private final RecordingRepository repository = new RecordingRepository();
    private final GtfsFeedReader reader = new GtfsFeedReader() {
        @Override
        public GtfsFeed read(final Path feedDirectory) {
            return FEED;
        }
    };

    @Test
    @DisplayName("GTFS를 읽어 노선망을 교체하고 적재 건수를 돌려준다")
    void replacesNetworkWithFeed() {
        GtfsImportService service = new GtfsImportService(directory.toString(), reader, repository,
                new TransactionTemplate(new NoOpTransactionManager()));

        GtfsImportResult result = service.importFeed();

        assertThat(repository.replacedFeeds).containsExactly(FEED);
        assertThat(result).isEqualTo(new GtfsImportResult(1, 2, 0, 0));
    }

    @Test
    @DisplayName("GTFS 디렉터리가 비어 있거나 존재하지 않으면 적재하지 않는다")
    void rejectsMissingDirectory() {
        TransactionTemplate transactionTemplate = new TransactionTemplate(new NoOpTransactionManager());

        assertThatThrownBy(() -> new GtfsImportService("", reader, repository, transactionTemplate).importFeed())
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new GtfsImportService(directory.resolve("none").toString(), reader, repository,
                transactionTemplate).importFeed())
                .isInstanceOf(IllegalStateException.class);
        assertThat(repository.replacedFeeds).isEmpty();
    }

    private static class RecordingRepository implements GtfsNetworkRepository {

        private final List<GtfsFeed> replacedFeeds = new ArrayList<>();

        @Override
        public void replace(final GtfsFeed feed) {
            replacedFeeds.add(feed);
        }
    }

    private static class NoOpTransactionManager extends AbstractPlatformTransactionManager {

        @Override
        protected Object doGetTransaction() {
            return new Object();
        }

        @Override
        protected void doBegin(final Object transaction, final TransactionDefinition definition) {
        }

        @Override
        protected void doCommit(final DefaultTransactionStatus status) {
        }

        @Override
        protected void doRollback(final DefaultTransactionStatus status) {
        }
    }
}
