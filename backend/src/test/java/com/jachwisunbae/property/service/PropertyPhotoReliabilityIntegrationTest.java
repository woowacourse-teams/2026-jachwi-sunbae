package com.jachwisunbae.property.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import com.jachwisunbae.member.service.MemberService;
import com.jachwisunbae.property.repository.PhotoStorageCleanupRepository;
import com.jachwisunbae.property.scheduler.PhotoStorageCleanupScheduler;
import com.jachwisunbae.property.storage.PhotoStorage;
import com.zaxxer.hikari.HikariDataSource;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.sql.DriverManager;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import javax.sql.DataSource;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest(properties = {"spring.datasource.hikari.maximum-pool-size=1",
        "spring.datasource.hikari.connection-timeout=1000"})
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class PropertyPhotoReliabilityIntegrationTest {

    @Container
    @ServiceConnection
    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4.10")
            .withCommand("--log-bin-trust-function-creators=1");

    private static final byte[] PNG = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=");

    @Autowired
    private PropertyPhotoService service;
    @Autowired
    private PropertyDeletionService deletionService;
    @Autowired
    private MemberService memberService;
    @Autowired
    private PropertyPhotoThumbnailBackfillService backfill;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private DataSource dataSource;
    @Autowired
    private PhotoStorageCleanupService cleanup;
    @Autowired
    private Clock clock;
    @MockitoSpyBean
    private PlatformTransactionManager transactionManager;
    @MockitoBean
    private PhotoStorage storage;

    private final Map<String, byte[]> objects = new ConcurrentHashMap<>();
    private final AtomicBoolean failCommit = new AtomicBoolean();
    private final AtomicBoolean failDeletes = new AtomicBoolean();
    private final AtomicBoolean loseCommitResponse = new AtomicBoolean();
    private final AtomicBoolean responsePending = new AtomicBoolean();

    @BeforeEach
    void setUp() throws java.sql.SQLException {
        var pool = dataSource.unwrap(HikariDataSource.class);
        pool.setMaximumPoolSize(1);
        pool.getHikariPoolMXBean().softEvictConnections();
        objects.clear();
        failCommit.set(false);
        failDeletes.set(false);
        loseCommitResponse.set(false);
        responsePending.set(false);
        jdbc.update("DELETE FROM photo_storage_cleanup_requests");
        jdbc.update("DELETE FROM main_property_photos");
        jdbc.update("DELETE FROM property_photos");
        jdbc.update("DELETE FROM properties");
        jdbc.update("DELETE FROM members");
        jdbc.update("INSERT INTO members (id, created_at, updated_at) VALUES (1, NOW(6), NOW(6))");
        jdbc.update("INSERT INTO properties (id, member_id, name, created_at) VALUES (10, 1, '집', NOW(6))");
        doAnswer(invocation -> {
            objects.put(invocation.getArgument(0), invocation.getArgument(1));
            if (loseCommitResponse.compareAndSet(true, false)) {
                responsePending.set(true);
            }
            if (failCommit.compareAndSet(true, false)) {
                long connectionId = jdbc.queryForObject("SELECT CONNECTION_ID()", Long.class);
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void beforeCommit(boolean readOnly) {
                        killConnection(connectionId);
                    }
                });
            }
            return null;
        }).when(storage).upload(anyString(), any(byte[].class), anyString());
        doAnswer(invocation -> {
            if (failDeletes.get()) {
                throw new UpstreamServiceException(ErrorCode.PHOTO_STORAGE_FAILURE, "injected storage delete failure");
            }
            objects.remove(invocation.<String>getArgument(0));
            return null;
        }).when(storage).delete(anyString());
        doAnswer(invocation -> {
            invocation.callRealMethod();
            if (responsePending.compareAndSet(true, false)) {
                throw new TransactionSystemException("injected lost commit response");
            }
            return null;
        }).when(transactionManager).commit(any(TransactionStatus.class));
    }

    @AfterEach
    void removeTrigger() {
        jdbc.execute("DROP TRIGGER IF EXISTS fail_photo_write");
        jdbc.execute("DROP TRIGGER IF EXISTS fail_cleanup_delete");
    }

    @Test
    @DisplayName("사진 저장 콜백 성공 뒤 실제 MySQL COMMIT이 실패해도 원본·썸네일을 회수한다")
    void compensatesFinalCommitFailure() {
        // given
        failCommit.set(true);

        // when & then
        assertThatThrownBy(() -> service.upload(1L, 10L, png())).isInstanceOf(RuntimeException.class);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM property_photos", Integer.class)).isZero();
        assertThat(objects).isEmpty();
    }

    @Test
    @DisplayName("사진 INSERT 실패 시 DB와 대표 사진은 롤백하고 원본·썸네일을 회수한다")
    void compensatesMetadataInsertFailure() {
        // given
        failSql("INSERT ON property_photos");

        // when & then
        assertThatThrownBy(() -> service.upload(1L, 10L, png())).isInstanceOf(DataAccessException.class)
                .hasMessageContaining("injected photo failure");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM property_photos", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM main_property_photos", Integer.class)).isZero();
        assertThat(objects).isEmpty();
    }

    @Test
    @DisplayName("실제 커밋 성공 뒤 응답만 유실되면 저장된 사진과 파일을 삭제하지 않는다")
    void preservesFilesWhenCommitResponseIsLost() {
        // given
        loseCommitResponse.set(true);

        // when & then
        assertThatThrownBy(() -> service.upload(1L, 10L, png())).isInstanceOf(TransactionSystemException.class)
                .hasMessageContaining("injected lost commit response");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM property_photos", Integer.class)).isOne();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM main_property_photos", Integer.class)).isOne();
        assertThat(cleanupCount()).isZero();
        assertThat(objects).hasSize(2);
    }

    @Test
    @DisplayName("보상 파일 삭제가 실패해도 영속 요청을 남겨 새 처리기가 원본·썸네일을 회수한다")
    void retriesFailedCompensationAfterRestart() {
        // given
        failSql("INSERT ON property_photos");
        failDeletes.set(true);
        assertThatThrownBy(() -> service.upload(1L, 10L, png())).isInstanceOf(DataAccessException.class);
        assertThat(objects).hasSize(2);
        assertThat(cleanupCount()).isOne();

        // when
        failDeletes.set(false);
        futureCleanup().processDue();

        // then
        assertThat(objects).isEmpty();
        assertThat(cleanupCount()).isZero();
    }

    @Test
    @DisplayName("업로드 도중 프로세스가 종료된 상태의 영속 기록으로 남은 파일을 회수한다")
    void recoversInterruptedUpload() {
        // given
        insertAbandonedUpload();
        assertThat(cleanup.processDue()).isZero();

        // when
        new PhotoStorageCleanupScheduler(futureCleanup()).clean();

        // then
        assertThat(objects).isEmpty();
        assertThat(cleanupCount()).isZero();
    }

    @Test
    @DisplayName("파일 삭제 성공 뒤 정리 요청 DELETE가 실패해도 재실행으로 요청을 완료한다")
    void retriesAfterCleanupDatabaseFailure() {
        // given
        insertAbandonedUpload();
        jdbc.execute("""
                CREATE TRIGGER fail_cleanup_delete BEFORE DELETE ON photo_storage_cleanup_requests
                FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'injected cleanup delete failure'
                """);

        // when
        futureCleanup().processDue();

        // then
        assertThat(objects).isEmpty();
        assertThat(cleanupCount()).isOne();
        jdbc.execute("DROP TRIGGER fail_cleanup_delete");
        jdbc.update("UPDATE photo_storage_cleanup_requests SET next_attempt_at = NOW(6)");
        futureCleanup().processDue();
        assertThat(cleanupCount()).isZero();
    }

    @Test
    @DisplayName("정리 유예 시간이 지나도 업로드 중인 요청의 파일은 다른 처리기가 삭제하지 않는다")
    void skipsUploadWhileItsTransactionHoldsTheRequest() throws Exception {
        // given
        dataSource.unwrap(HikariDataSource.class).setMaximumPoolSize(2);
        CountDownLatch entered = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        AtomicBoolean first = new AtomicBoolean(true);
        doAnswer(invocation -> {
            objects.put(invocation.getArgument(0), invocation.getArgument(1));
            if (first.compareAndSet(true, false)) {
                entered.countDown();
                assertThat(release.await(10, TimeUnit.SECONDS)).isTrue();
            }
            return null;
        }).when(storage).upload(anyString(), any(byte[].class), anyString());

        try (var executor = Executors.newSingleThreadExecutor()) {
            var upload = executor.submit(() -> service.upload(1L, 10L, png()));
            try {
                assertThat(entered.await(10, TimeUnit.SECONDS)).isTrue();

                // when
                futureCleanup().processDue();

                // then
                assertThat(objects).hasSize(1);
                assertThat(cleanupCount()).isOne();
            } finally {
                release.countDown();
            }
            assertThat(upload.get(10, TimeUnit.SECONDS)).isNotNull();
            assertThat(objects).hasSize(2);
            assertThat(cleanupCount()).isZero();
        }
    }

    @Test
    @DisplayName("논리 삭제한 사진을 참조하는 파일도 업로드 정리 대상으로 지우지 않는다")
    void preservesRetainedPhotoFiles() {
        // given
        var photo = service.upload(1L, 10L, png()).photo();
        service.delete(1L, 10L, photo.getId());
        new PhotoStorageCleanupRepository(jdbc).save(photo.getStorageKey(), photo.getThumbnailStorageKey(),
                java.time.LocalDateTime.now(clock), java.time.LocalDateTime.now(clock));

        // when
        cleanup.processDue();

        // then
        assertThat(service.find(1L, 10L).photos()).isEmpty();
        assertThat(jdbc.queryForObject("SELECT deleted_at IS NOT NULL FROM property_photos", Boolean.class)).isTrue();
        assertThat(objects).hasSize(2);
        assertThat(cleanupCount()).isZero();
        assertThat(cleanupAt(LocalDateTime.now(clock).plusDays(120)).processDue()).isZero();
        assertThat(objects).hasSize(2);
    }

    @Test
    @DisplayName("썸네일 생성 불가 형식은 원본만 저장해 성공하고 복구 요청을 남기지 않는다")
    void acceptsOriginalWhenThumbnailCannotBeGenerated() {
        // given
        byte[] heic = ByteBuffer.allocate(20).putInt(20).put("ftypheic".getBytes(StandardCharsets.US_ASCII))
                .putInt(0).put("heic".getBytes(StandardCharsets.US_ASCII)).array();

        // when
        var result = service.upload(1L, 10L, new MockMultipartFile("file", "room.heic", "image/heic", heic));

        // then
        assertThat(result.photo().hasThumbnail()).isFalse();
        assertThat(objects).containsOnlyKeys(result.photo().getStorageKey());
        assertThat(cleanupCount()).isZero();
    }

    @Test
    @DisplayName("썸네일 보충의 실제 COMMIT 실패는 원본을 보존하고 새 썸네일만 회수한다")
    void compensatesBackfillCommitFailure() {
        // given
        var photo = service.upload(1L, 10L, png()).photo();
        jdbc.update("UPDATE property_photos SET thumbnail_storage_key = NULL");
        objects.remove(photo.getThumbnailStorageKey());
        when(storage.download(anyString())).thenAnswer(invocation -> objects.get(invocation.<String>getArgument(0)));
        failCommit.set(true);

        // when & then
        assertThatThrownBy(() -> backfill.backfill(0, 20)).isInstanceOf(RuntimeException.class);
        assertThat(jdbc.queryForObject("SELECT thumbnail_storage_key FROM property_photos", String.class)).isNull();
        assertThat(objects).containsOnlyKeys(photo.getStorageKey());
        assertThat(cleanupCount()).isZero();
    }

    @Test
    @DisplayName("썸네일 보충 실패의 정리 기록이 남아 있어도 같은 사진의 보충을 재시도할 수 있다")
    void retriesBackfillWithPendingCleanup() {
        // given
        var photo = service.upload(1L, 10L, png()).photo();
        jdbc.update("UPDATE property_photos SET thumbnail_storage_key = NULL");
        objects.remove(photo.getThumbnailStorageKey());
        when(storage.download(anyString())).thenAnswer(invocation -> objects.get(invocation.<String>getArgument(0)));
        failSql("UPDATE ON property_photos");
        failDeletes.set(true);
        assertThatThrownBy(() -> backfill.backfill(0, 20)).isInstanceOf(DataAccessException.class);
        assertThat(cleanupCount()).isOne();

        // when
        jdbc.execute("DROP TRIGGER fail_photo_write");
        failDeletes.set(false);
        var result = backfill.backfill(0, 20);

        // then
        assertThat(result.created()).isOne();
        assertThat(jdbc.queryForObject("SELECT thumbnail_storage_key FROM property_photos", String.class))
                .isEqualTo(photo.getThumbnailStorageKey());
        assertThat(objects).hasSize(2);
        assertThat(cleanupCount()).isZero();
    }

    @Test
    @DisplayName("영속 복구 기록을 저장할 수 없으면 파일 전송을 시작하지 않는다")
    void refusesUploadWithoutDurableRecoveryRecord() {
        // given
        failSql("INSERT ON photo_storage_cleanup_requests");

        // when & then
        assertThatThrownBy(() -> service.upload(1L, 10L, png())).isInstanceOf(DataAccessException.class)
                .hasMessageContaining("injected photo failure");
        assertThat(objects).isEmpty();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM property_photos", Integer.class)).isZero();
    }

    @ParameterizedTest
    @ValueSource(strings = {"image/png", "image/jpeg"})
    @DisplayName("원본·썸네일 업로드가 파일 저장 후 실패 응답을 반환해도 전체 업로드를 실패시키고 회수한다")
    void compensatesStorageFailureAfterWritingObject(String failingContentType) {
        // given
        doAnswer(invocation -> {
            objects.put(invocation.getArgument(0), invocation.getArgument(1));
            if (failingContentType.equals(invocation.getArgument(2))) {
                throw new UpstreamServiceException(ErrorCode.PHOTO_STORAGE_FAILURE, "injected partial upload failure");
            }
            return null;
        }).when(storage).upload(anyString(), any(byte[].class), anyString());

        // when & then
        assertThatThrownBy(() -> service.upload(1L, 10L, png()))
                .isInstanceOfSatisfying(UpstreamServiceException.class,
                        error -> assertThat(error.getErrorCode()).isEqualTo(ErrorCode.PHOTO_STORAGE_FAILURE));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM property_photos", Integer.class)).isZero();
        assertThat(objects).isEmpty();
        assertThat(cleanupCount()).isZero();
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    @DisplayName("매물·회원 삭제 후 90일 직전까지 파일을 보존하고 경계 시각부터 파기한다")
    void purgesFilesOnlyAfterRetentionDeadline(boolean memberDeletion) {
        // given
        service.upload(1L, 10L, png());
        LocalDateTime deletedAt = LocalDateTime.of(2026, 1, 1, 0, 0);
        if (memberDeletion) {
            memberService.delete(1L);
            jdbc.update("UPDATE members SET deleted_at = ? WHERE id = 1", deletedAt);
        } else {
            deletionService.delete(1L, 10L);
            jdbc.update("UPDATE properties SET deleted_at = ? WHERE id = 10", deletedAt);
        }
        assertThat(cleanupAt(deletedAt.plusDays(90).minusNanos(1000)).processDue()).isZero();
        assertThat(objects).hasSize(2);

        // when
        assertThat(cleanupAt(deletedAt.plusDays(90)).processDue()).isOne();

        // then
        assertThat(objects).isEmpty();
        assertThat(jdbc.queryForObject("SELECT storage_purged_at FROM property_photos", LocalDateTime.class))
                .isEqualTo(deletedAt.plusDays(90));
        assertThat(cleanupAt(deletedAt.plusDays(90)).processDue()).isZero();
    }

    @Test
    @DisplayName("보관 파일 삭제 실패와 완료 기록 SQL 실패 뒤에도 재시도해 파기를 완료한다")
    void retriesRetentionPurgeFailures() {
        // given
        service.upload(1L, 10L, png());
        deletionService.delete(1L, 10L);
        LocalDateTime deletedAt = LocalDateTime.of(2026, 1, 1, 0, 0);
        jdbc.update("UPDATE properties SET deleted_at = ?", deletedAt);
        failDeletes.set(true);
        cleanupAt(deletedAt.plusDays(90)).processDue();
        assertThat(objects).hasSize(2);
        assertThat(jdbc.queryForObject("SELECT storage_purged_at FROM property_photos", LocalDateTime.class)).isNull();

        // when
        failDeletes.set(false);
        jdbc.execute("""
                CREATE TRIGGER fail_photo_write BEFORE UPDATE ON property_photos
                FOR EACH ROW
                BEGIN
                    IF NEW.storage_purged_at IS NOT NULL THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'injected purge completion failure';
                    END IF;
                END
                """);
        cleanupAt(deletedAt.plusDays(90).plusMinutes(5)).processDue();

        // then
        assertThat(objects).isEmpty();
        assertThat(jdbc.queryForObject("SELECT storage_purged_at FROM property_photos", LocalDateTime.class)).isNull();
        jdbc.execute("DROP TRIGGER fail_photo_write");
        cleanupAt(deletedAt.plusDays(90).plusMinutes(10)).processDue();
        assertThat(jdbc.queryForObject("SELECT storage_purged_at FROM property_photos", LocalDateTime.class)).isNotNull();
    }

    private PhotoStorageCleanupService cleanupAt(LocalDateTime now) {
        return new PhotoStorageCleanupService(new PhotoStorageCleanupRepository(jdbc), storage,
                Clock.fixed(now.toInstant(ZoneOffset.UTC), ZoneOffset.UTC), transactionManager);
    }

    private void insertAbandonedUpload() {
        new PhotoStorageCleanupRepository(jdbc).save("orphan/original.png", "orphan/thumbnail.jpg",
                java.time.LocalDateTime.now(clock), java.time.LocalDateTime.now(clock).plusHours(1));
        objects.put("orphan/original.png", PNG);
        objects.put("orphan/thumbnail.jpg", PNG);
    }

    private PhotoStorageCleanupService futureCleanup() {
        return new PhotoStorageCleanupService(new PhotoStorageCleanupRepository(jdbc), storage,
                Clock.fixed(clock.instant().plus(Duration.ofHours(2)), ZoneOffset.UTC), transactionManager);
    }

    private int cleanupCount() {
        return jdbc.queryForObject("SELECT COUNT(*) FROM photo_storage_cleanup_requests", Integer.class);
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    @DisplayName("사진·매물 삭제 SQL이 실패하면 DB 롤백 뒤에도 파일을 그대로 읽을 수 있다")
    void preservesFilesWhenDeletionRollsBack(boolean propertyDeletion) {
        // given
        long photoId = service.upload(1L, 10L, png()).photo().getId();
        Map<String, byte[]> before = new HashMap<>(objects);
        failSql(propertyDeletion ? "UPDATE ON properties" : "UPDATE ON property_photos");

        // when & then
        assertThatThrownBy(() -> {
            if (propertyDeletion) {
                deletionService.delete(1L, 10L);
            } else {
                service.delete(1L, 10L, photoId);
            }
        }).isInstanceOf(DataAccessException.class).hasMessageContaining("injected photo failure");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM property_photos", Integer.class)).isOne();
        assertThat(jdbc.queryForObject("SELECT deleted_at IS NULL FROM properties", Boolean.class)).isTrue();
        assertThat(objects).containsExactlyInAnyOrderEntriesOf(before);
    }

    private void failSql(String point) {
        jdbc.execute("CREATE TRIGGER fail_photo_write BEFORE " + point
                + " FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'injected photo failure'");
    }

    private static void killConnection(long connectionId) {
        try (var connection = DriverManager.getConnection(MYSQL.getJdbcUrl(), "root", MYSQL.getPassword());
             var statement = connection.createStatement()) {
            statement.execute("KILL CONNECTION " + connectionId);
        } catch (java.sql.SQLException exception) {
            throw new IllegalStateException("일회용 MySQL 테스트 연결을 종료하지 못했습니다.", exception);
        }
    }

    private MockMultipartFile png() {
        return new MockMultipartFile("file", "room.png", "image/png", PNG);
    }
}
