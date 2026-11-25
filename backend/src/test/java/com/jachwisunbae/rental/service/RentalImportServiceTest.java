package com.jachwisunbae.rental.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.awaitility.Awaitility.await;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jachwisunbae.rental.domain.ContractType;
import com.jachwisunbae.rental.domain.HousingType;
import com.jachwisunbae.rental.domain.RentalSnapshot;
import com.jachwisunbae.rental.domain.RentalTransaction;
import com.jachwisunbae.rental.domain.vo.LegalDong;
import com.jachwisunbae.rental.domain.vo.RentalArea;
import com.jachwisunbae.rental.domain.vo.RentalPrice;
import com.jachwisunbae.rental.domain.vo.RentalSource;
import com.jachwisunbae.rental.repository.JdbcAdminDongRentRepository;
import com.jachwisunbae.rental.repository.JdbcRentalTransactionRepository;
import com.jachwisunbae.transit.domain.AdminDong;
import com.jachwisunbae.transit.repository.JdbcAdminDongRepository;
import java.math.BigDecimal;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.LongStream;
import javax.sql.DataSource;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.JdbcTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

// 교체가 한 트랜잭션으로 커밋되거나 롤백되는지 보려고 테스트 트랜잭션 없이 실행한다.
@Testcontainers
@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class RentalImportServiceTest {

    @Container
    @ServiceConnection
    private static final MySQLContainer<?> mysqlContainer = new MySQLContainer<>("mysql:8.4.10")
            .withCommand("--log-bin-trust-function-creators=1");

    private static final LegalDong SILLIM = new LegalDong("1162010200", "서울특별시 관악구 신림동");
    private static final LocalDate PERIOD_START = LocalDate.parse("2026-04-10");
    private static final LocalDate PERIOD_END = LocalDate.parse("2026-10-09");

    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private DataSource dataSource;

    private RentalImportService service;
    private JdbcTemplate databaseAdmin;

    @TempDir
    private Path work;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM admin_dong_rents");
        jdbcTemplate.update("DELETE FROM admin_legal_dongs");
        jdbcTemplate.update("DELETE FROM rental_transactions");
        jdbcTemplate.update("DELETE FROM rental_datasets");
        jdbcTemplate.update("DELETE FROM legal_dongs");
        jdbcTemplate.update("DELETE FROM admin_dongs");
        databaseAdmin = new JdbcTemplate(new DriverManagerDataSource(
                mysqlContainer.getJdbcUrl(), "root", mysqlContainer.getPassword()));
        service = new RentalImportService(new JdbcRentalTransactionRepository(jdbcTemplate),
                new AdminDongRentService(new JdbcAdminDongRentRepository(jdbcTemplate)),
                new TransactionTemplate(new DataSourceTransactionManager(dataSource)));
    }

    @AfterEach
    void removeFailureTrigger() {
        jdbcTemplate.execute("DROP TRIGGER IF EXISTS fail_rental_import");
    }

    @Test
    @DisplayName("처음 적재하면 법정동, 거래, 수집본 정보를 저장한다")
    void importsFirstSnapshot() {
        // when
        boolean imported = service.importSnapshot(snapshot("a", "2026-10-10T03:00:00Z"),
                List.of(transaction("2026-10-01", 1, 450_000L), transaction("2026-10-02", 2, 500_000L)));

        // then
        assertThat(imported).isTrue();
        assertThat(count("rental_transactions")).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject("SELECT name FROM legal_dongs WHERE code = ?", String.class,
                SILLIM.code())).isEqualTo(SILLIM.name());
        assertThat(jdbcTemplate.queryForObject("SELECT row_count FROM rental_datasets", Integer.class)).isEqualTo(2);
    }

    @Test
    @DisplayName("같은 수집본을 다시 적재하면 바꾸지 않는다")
    void skipsSameSnapshot() {
        // given
        RentalSnapshot snapshot = snapshot("a", "2026-10-10T03:00:00Z");
        List<RentalTransaction> transactions = List.of(transaction("2026-10-01", 1, 450_000L));
        service.importSnapshot(snapshot, transactions);
        long firstId = jdbcTemplate.queryForObject("SELECT id FROM rental_transactions", Long.class);

        // when
        boolean imported = service.importSnapshot(snapshot, transactions);

        // then
        assertThat(imported).isFalse();
        assertThat(jdbcTemplate.queryForObject("SELECT id FROM rental_transactions", Long.class)).isEqualTo(firstId);
    }

    @Test
    @DisplayName("같은 수집본인데 DB 거래 수가 다르면 거부한다")
    void rejectsSameSnapshotWithDifferentCount() {
        // given
        RentalSnapshot snapshot = snapshot("a", "2026-10-10T03:00:00Z");
        service.importSnapshot(snapshot, List.of(transaction("2026-10-01", 1, 450_000L)));

        // when // then
        assertThatThrownBy(() -> service.importSnapshot(snapshot,
                List.of(transaction("2026-10-01", 1, 450_000L), transaction("2026-10-02", 2, 450_000L))))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("건수가 일치하지 않습니다");
    }

    @Test
    @DisplayName("새 수집본은 기존 거래를 모두 바꾼다")
    void replacesWithNewerSnapshot() {
        // given
        service.importSnapshot(snapshot("a", "2026-10-10T03:00:00Z"),
                List.of(transaction("2026-10-01", 1, 450_000L), transaction("2026-10-02", 2, 450_000L)));

        // when
        boolean imported = service.importSnapshot(snapshot("c", "2026-10-11T03:00:00Z"),
                List.of(transaction("2026-10-03", 1, 600_000L)));

        // then
        assertThat(imported).isTrue();
        assertThat(jdbcTemplate.queryForList("SELECT monthly_rent_amount_krw FROM rental_transactions", Long.class))
                .containsExactly(600_000L);
        assertThat(jdbcTemplate.queryForObject("SELECT transaction_sha256 FROM rental_datasets", String.class))
                .isEqualTo("c".repeat(64));
    }

    @Test
    @DisplayName("이전 시점의 수집본으로는 바꾸지 않고 기존 거래를 남긴다")
    void rejectsOlderSnapshot() {
        // given
        service.importSnapshot(snapshot("a", "2026-10-11T03:00:00Z"), List.of(transaction("2026-10-01", 1, 450_000L)));

        // when // then
        assertThatThrownBy(() -> service.importSnapshot(snapshot("c", "2026-10-10T03:00:00Z"),
                List.of(transaction("2026-10-03", 1, 600_000L))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이전 시점");
        assertThat(jdbcTemplate.queryForList("SELECT monthly_rent_amount_krw FROM rental_transactions", Long.class))
                .containsExactly(450_000L);
    }

    @Test
    @DisplayName("빈 수집본이나 기간을 벗어난 거래는 DB에 닿기 전에 거부한다")
    void rejectsEmptyOrOutOfPeriodTransactions() {
        // given
        RentalSnapshot snapshot = snapshot("a", "2026-10-10T03:00:00Z");

        // when // then
        assertThatThrownBy(() -> service.importSnapshot(snapshot, List.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("빈 수집본");
        assertThatThrownBy(() -> service.importSnapshot(snapshot, List.of(transaction("2026-04-09", 1, 450_000L))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("기간을 벗어났습니다");
        assertThat(count("rental_datasets")).isZero();
    }

    @Test
    @DisplayName("적재하면 관할 법정동 거래로 행정동 월세 시세를 다시 계산한다")
    void refreshesAdminDongRents() {
        // given
        jdbcTemplate.update("""
                INSERT INTO admin_legal_dongs (admin_dong_code, legal_dong_code, legal_dong_name)
                VALUES ('11210680', ?, '신림동')
                """, SILLIM.code());
        List<RentalTransaction> transactions = LongStream.rangeClosed(1, 5)
                .mapToObj(row -> transaction("2026-10-0" + row, row, 400_000L + row * 10_000L))
                .toList();

        // when
        service.importSnapshot(snapshot("a", "2026-10-10T03:00:00Z"), transactions);

        // then
        assertThat(jdbcTemplate.queryForObject(
                "SELECT transaction_count FROM admin_dong_rents WHERE admin_dong_code = '11210680'", Integer.class))
                .isEqualTo(5);
    }

    @ParameterizedTest
    @ValueSource(strings = {"INSERT ON rental_transactions", "UPDATE ON rental_datasets", "INSERT ON admin_dong_rents"})
    @DisplayName("거래·수집본 정보·시세 저장 중 SQL이 실패하면 기존 전체 상태와 법정동을 복원한다")
    void rollsBackReplacementAndRentRefresh(String failurePoint) {
        // given
        seedRents();
        var before = databaseState();
        String condition = switch (failurePoint) {
            case "INSERT ON rental_transactions" -> "NEW.source_row_number = 3";
            case "UPDATE ON rental_datasets" -> "NOT (NEW.transaction_sha256 <=> OLD.transaction_sha256)";
            case "INSERT ON admin_dong_rents" -> "TRUE";
            default -> throw new IllegalArgumentException("알 수 없는 장애 주입 지점: " + failurePoint);
        };
        String action = "BEGIN IF " + condition + " THEN SIGNAL SQLSTATE '45000' "
                + "SET MESSAGE_TEXT = 'injected rental import failure'; END IF; END";
        jdbcTemplate.execute("CREATE TRIGGER fail_rental_import BEFORE " + failurePoint + " FOR EACH ROW " + action);
        var incoming = new ArrayList<>(deals(600_000L));
        incoming.add(new RentalTransaction(new LegalDong("1162010300", "서울특별시 관악구 남현동"),
                HousingType.ROWHOUSE, new RentalPrice(5_000_000L, 600_000L),
                new RentalArea(new BigDecimal("20"), HousingType.ROWHOUSE.areaBasis()), LocalDate.of(2026, 10, 6),
                ContractType.NEW, "새 빌라", "3", "-", new RentalSource("rent.csv", 6)));

        // when & then
        assertThatThrownBy(() -> service.importSnapshot(snapshot("c", "2026-10-11T03:00:00Z"), incoming))
                .isInstanceOf(DataAccessException.class).hasMessageContaining("injected rental import failure");
        assertThat(databaseState()).isEqualTo(before);
    }

    @Test
    @DisplayName("교체·시세 재계산 후 실제 MySQL COMMIT이 실패해도 기존 거래·메타데이터·시세를 복원한다")
    void rollsBackWhenFinalCommitFails() {
        // given
        seedRents();
        var before = databaseState();
        var repository = new JdbcRentalTransactionRepository(jdbcTemplate) {
            @Override
            public void updateSnapshot(RentalSnapshot snapshot, int transactionCount) {
                super.updateSnapshot(snapshot, transactionCount);
                long connectionId = jdbcTemplate.queryForObject("SELECT CONNECTION_ID()", Long.class);
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void beforeCommit(boolean readOnly) {
                        databaseAdmin.execute("KILL CONNECTION " + connectionId);
                    }
                });
            }
        };

        // when & then
        assertThatThrownBy(() -> importService(repository).importSnapshot(
                snapshot("c", "2026-10-11T03:00:00Z"), deals(600_000L)))
                .isInstanceOf(TransactionSystemException.class);
        assertThat(databaseState()).isEqualTo(before);
    }

    @ParameterizedTest
    @EnumSource(ConcurrentSnapshot.class)
    @DisplayName("동시 최초 적재는 dataset 잠금으로 직렬화하고 동일 수집본 생략·최신 수집본 보존을 유지한다")
    void serializesConcurrentImports(ConcurrentSnapshot scenario) throws Exception {
        // given
        insertMapping();
        var before = databaseState();
        CountDownLatch changed = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        RentalImportService first = importService(pausingRepository(changed, release));
        AtomicLong secondConnection = new AtomicLong();
        String secondTime = switch (scenario) {
            case SAME -> "2026-10-11T03:00:00Z";
            case NEWER -> "2026-10-12T03:00:00Z";
            case OLDER -> "2026-10-10T03:00:00Z";
        };
        RentalSnapshot secondSnapshot = snapshot(scenario == ConcurrentSnapshot.SAME ? "a" : "c", secondTime);

        try (var executor = Executors.newFixedThreadPool(2)) {
            var firstImport = executor.submit(() -> first.importSnapshot(
                    snapshot("a", "2026-10-11T03:00:00Z"), deals(450_000L)));
            try {
                waitFor(changed);
                var secondImport = executor.submit(() -> transaction().execute(status -> {
                    secondConnection.set(jdbcTemplate.queryForObject("SELECT CONNECTION_ID()", Long.class));
                    return service.importSnapshot(secondSnapshot,
                            deals(scenario == ConcurrentSnapshot.SAME ? 450_000L : 600_000L));
                }));

                // when
                await().atMost(Duration.ofSeconds(10)).until(() -> isWaitingForLock(secondConnection.get()));
                assertThat(secondImport.isDone()).isFalse();
                assertThat(databaseState()).as("미커밋 교체는 다른 연결에 노출되지 않는다").isEqualTo(before);
                release.countDown();

                // then
                assertThat(firstImport.get(10, TimeUnit.SECONDS)).isTrue();
                if (scenario == ConcurrentSnapshot.OLDER) {
                    assertThatThrownBy(() -> secondImport.get(10, TimeUnit.SECONDS))
                            .isInstanceOfSatisfying(ExecutionException.class,
                                    error -> assertThat(error.getCause()).isInstanceOf(IllegalArgumentException.class)
                                            .hasMessageContaining("이전 시점"));
                } else {
                    assertThat(secondImport.get(10, TimeUnit.SECONDS)).isEqualTo(scenario == ConcurrentSnapshot.NEWER);
                }
                assertCurrentPrice(scenario == ConcurrentSnapshot.NEWER ? "c" : "a",
                        scenario == ConcurrentSnapshot.NEWER ? 600_000L : 450_000L);
            } finally {
                release.countDown();
            }
        }
    }

    @Test
    @DisplayName("연결표 적재가 월세 교체와 겹쳐도 최신 거래·수집본과 같은 시세를 커밋한다")
    void keepsRentsConsistentWhenLinkImportOverlapsReplacement() throws Exception {
        // given
        seedRents();
        Path file = createLinkFile();
        CountDownLatch datasetChanged = new CountDownLatch(1);
        CountDownLatch releaseRental = new CountDownLatch(1);
        CountDownLatch adminRowsRead = new CountDownLatch(1);
        CountDownLatch releaseLinks = new CountDownLatch(1);
        var adminDongs = new JdbcAdminDongRepository(jdbcTemplate, new ObjectMapper()) {
            @Override
            public List<AdminDong> findAll() {
                var rows = super.findAll();
                adminRowsRead.countDown();
                waitFor(releaseLinks);
                return rows;
            }
        };
        var links = new AdminLegalDongImportService(file.toString(), adminDongs,
                new JdbcAdminDongRentRepository(jdbcTemplate),
                new AdminDongRentService(new JdbcAdminDongRentRepository(jdbcTemplate)));
        AtomicLong linkConnection = new AtomicLong();

        try (var executor = Executors.newFixedThreadPool(2)) {
            var replacing = executor.submit(() -> importService(pausingRepository(datasetChanged, releaseRental))
                    .importSnapshot(snapshot("c", "2026-10-11T03:00:00Z"), deals(600_000L)));
            try {
                waitFor(datasetChanged);
                var linking = executor.submit(() -> transaction().execute(status -> {
                    linkConnection.set(jdbcTemplate.queryForObject("SELECT CONNECTION_ID()", Long.class));
                    return links.importLinks();
                }));
                await().atMost(Duration.ofSeconds(10)).until(() -> adminRowsRead.getCount() == 0
                        || isWaitingForLock(linkConnection.get()));

                // when
                releaseRental.countDown();
                assertThat(replacing.get(10, TimeUnit.SECONDS)).isTrue();
                releaseLinks.countDown();
                assertThat(linking.get(10, TimeUnit.SECONDS)).isOne();

                // then
                assertCurrentPrice("c", 600_000L);
            } finally {
                releaseRental.countDown();
                releaseLinks.countDown();
            }
        }
    }

    @Test
    @DisplayName("연결표 적재가 먼저 시작해도 월세 교체가 같은 잠금을 기다린 뒤 새 거래의 시세를 저장한다")
    void waitsForLinkImportBeforeReplacingSnapshot() throws Exception {
        // given
        seedRents();
        Path file = createLinkFile();
        CountDownLatch read = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        var adminDongs = new JdbcAdminDongRepository(jdbcTemplate, new ObjectMapper()) {
            @Override
            public List<AdminDong> findAll() {
                var rows = super.findAll();
                read.countDown();
                waitFor(release);
                return rows;
            }
        };
        var links = linkService(file, adminDongs);
        AtomicLong rentalConnection = new AtomicLong();
        try (var executor = Executors.newFixedThreadPool(2)) {
            var linking = executor.submit(() -> transaction().execute(status -> links.importLinks()));
            try {
                waitFor(read);
                var replacing = executor.submit(() -> transaction().execute(status -> {
                    rentalConnection.set(jdbcTemplate.queryForObject("SELECT CONNECTION_ID()", Long.class));
                    return service.importSnapshot(snapshot("c", "2026-10-11T03:00:00Z"), deals(600_000L));
                }));

                // when
                await().atMost(Duration.ofSeconds(10)).until(() -> isWaitingForLock(rentalConnection.get()));
                assertThat(replacing.isDone()).isFalse();
                release.countDown();

                // then
                assertThat(linking.get(10, TimeUnit.SECONDS)).isOne();
                assertThat(replacing.get(10, TimeUnit.SECONDS)).isTrue();
                assertCurrentPrice("c", 600_000L);
            } finally {
                release.countDown();
            }
        }
    }

    @Test
    @DisplayName("연결표 재계산 실패는 연결표 변경과 기존 시세를 함께 롤백한다")
    void rollsBackLinkReplacementWhenRentRefreshFails() throws Exception {
        // given
        seedRents();
        Path file = createLinkFile();
        jdbcTemplate.update("UPDATE admin_legal_dongs SET legal_dong_name = '이전 연결 이름'");
        transaction().executeWithoutResult(status -> new AdminDongRentService(
                new JdbcAdminDongRentRepository(jdbcTemplate)).refresh());
        var before = databaseState();
        jdbcTemplate.execute("""
                CREATE TRIGGER fail_rental_import BEFORE INSERT ON admin_dong_rents
                FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'injected rent refresh failure'
                """);

        // when & then
        assertThatThrownBy(() -> transaction().execute(status -> linkService(file,
                new JdbcAdminDongRepository(jdbcTemplate, new ObjectMapper())).importLinks()))
                .isInstanceOf(DataAccessException.class).hasMessageContaining("injected rent refresh failure");
        assertThat(databaseState()).isEqualTo(before);
    }

    @Test
    @DisplayName("월세 수집본이 없는 DB에서도 연결표를 적재하고 이후 첫 월세 적재를 진행할 수 있다")
    void importsLinksBeforeTheFirstSnapshot() throws Exception {
        // given
        Path file = createLinkFile();

        // when
        Integer imported = transaction().execute(status -> linkService(file,
                new JdbcAdminDongRepository(jdbcTemplate, new ObjectMapper())).importLinks());
        assertThat(imported).isOne();

        // then
        assertThat(new JdbcRentalTransactionRepository(jdbcTemplate).findDatasetInfo()).isEmpty();
        assertThat(count("admin_dong_rents")).isZero();
        assertThat(service.importSnapshot(snapshot("a", "2026-10-10T03:00:00Z"), deals(450_000L))).isTrue();
        assertCurrentPrice("a", 450_000L);
    }

    private AdminLegalDongImportService linkService(Path file, JdbcAdminDongRepository adminDongs) {
        return new AdminLegalDongImportService(file.toString(), adminDongs,
                new JdbcAdminDongRentRepository(jdbcTemplate),
                new AdminDongRentService(new JdbcAdminDongRentRepository(jdbcTemplate)));
    }

    private void seedRents() {
        insertMapping();
        service.importSnapshot(snapshot("a", "2026-10-10T03:00:00Z"), deals(450_000L));
    }

    private void insertMapping() {
        jdbcTemplate.update("""
                INSERT INTO admin_legal_dongs (admin_dong_code, legal_dong_code, legal_dong_name)
                VALUES ('11210680', ?, '신림동')
                """, SILLIM.code());
    }

    private List<RentalTransaction> deals(long monthlyRent) {
        return LongStream.rangeClosed(1, 5)
                .mapToObj(row -> transaction("2026-10-0" + row, row, monthlyRent)).toList();
    }

    private RentalImportService importService(JdbcRentalTransactionRepository repository) {
        return new RentalImportService(repository, new AdminDongRentService(new JdbcAdminDongRentRepository(jdbcTemplate)),
                transaction());
    }

    private TransactionTemplate transaction() {
        return new TransactionTemplate(new DataSourceTransactionManager(dataSource));
    }

    private JdbcRentalTransactionRepository pausingRepository(CountDownLatch changed, CountDownLatch release) {
        return new JdbcRentalTransactionRepository(jdbcTemplate) {
            @Override
            public void updateSnapshot(RentalSnapshot snapshot, int transactionCount) {
                super.updateSnapshot(snapshot, transactionCount);
                changed.countDown();
                waitFor(release);
            }
        };
    }

    private boolean isWaitingForLock(long connectionId) {
        return Boolean.TRUE.equals(databaseAdmin.queryForObject("""
                SELECT EXISTS(SELECT 1 FROM performance_schema.data_lock_waits w
                JOIN performance_schema.threads t ON t.THREAD_ID = w.REQUESTING_THREAD_ID
                WHERE t.PROCESSLIST_ID = ?)
                """, Boolean.class, connectionId));
    }

    private void assertCurrentPrice(String hashCharacter, long price) {
        assertThat(jdbcTemplate.queryForObject("SELECT transaction_sha256 FROM rental_datasets", String.class))
                .isEqualTo(hashCharacter.repeat(64));
        assertThat(jdbcTemplate.queryForObject("SELECT row_count FROM rental_datasets", Integer.class)).isEqualTo(5);
        assertThat(jdbcTemplate.queryForList("SELECT monthly_rent_amount_krw FROM rental_transactions", Long.class))
                .containsExactly(price, price, price, price, price);
        assertThat(jdbcTemplate.queryForObject("SELECT monthly_rent_krw FROM admin_dong_rents", Long.class))
                .isEqualTo(price);
    }

    private List<List<Map<String, Object>>> databaseState() {
        return List.of(jdbcTemplate.queryForList("SELECT * FROM legal_dongs ORDER BY code"),
                jdbcTemplate.queryForList("SELECT * FROM rental_datasets ORDER BY dataset_key"),
                jdbcTemplate.queryForList("SELECT * FROM rental_transactions ORDER BY id"),
                jdbcTemplate.queryForList("SELECT * FROM admin_legal_dongs ORDER BY admin_dong_code, legal_dong_code"),
                jdbcTemplate.queryForList("SELECT * FROM admin_dong_rents ORDER BY admin_dong_code"));
    }

    private Path createLinkFile() throws Exception {
        jdbcTemplate.update("""
                INSERT INTO admin_dongs
                    (code, name, sido_name, sigungu_name, full_name, center_latitude, center_longitude, boundary, base_date)
                VALUES ('11210680', '신림동', '서울특별시', '관악구', '서울특별시 관악구 신림동', 37.5, 127,
                        '{"type":"Polygon","coordinates":[[[127,37.5],[127.1,37.5],[127.1,37.6],[127,37.5]]]}', '2026-01-01')
                """);
        Path file = work.resolve("KIKmix.txt");
        Files.write(file, List.of(
                fixedWidth("행정동코드", "시도명", "시군구명", "읍면동명", "법정동코드", "동리명", "생성일자", "말소일자"),
                fixedWidth("1162069500", "서울특별시", "관악구", "신림동", SILLIM.code(), "신림동", "19880423", "")),
                Charset.forName("MS949"));
        return file;
    }

    private String fixedWidth(String... values) {
        int[] widths = {10, 30, 30, 30, 10, 30, 8, 8};
        StringBuilder row = new StringBuilder();
        for (int index = 0; index < values.length; index++) {
            row.append(values[index]).append(" ".repeat(widths[index]
                    - values[index].getBytes(Charset.forName("MS949")).length + 1));
        }
        return row.toString();
    }

    private static void waitFor(CountDownLatch latch) {
        try {
            assertThat(latch.await(10, TimeUnit.SECONDS)).as("작업자 동기화 제한 시간").isTrue();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("작업자 동기화가 중단됐습니다.", exception);
        }
    }

    private enum ConcurrentSnapshot {
        SAME, NEWER, OLDER
    }

    private long count(final String table) {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + table, Long.class);
    }

    private RentalSnapshot snapshot(final String hashCharacter, final String collectedAt) {
        return new RentalSnapshot(RentalSnapshot.DATASET_KEY, hashCharacter.repeat(64), "b".repeat(64),
                PERIOD_START, PERIOD_END, Instant.parse(collectedAt));
    }

    private RentalTransaction transaction(final String contractDate, final long row, final long monthlyRent) {
        return new RentalTransaction(SILLIM, HousingType.ROWHOUSE, new RentalPrice(5_000_000L, monthlyRent),
                new RentalArea(new BigDecimal("20"), HousingType.ROWHOUSE.areaBasis()),
                LocalDate.parse(contractDate), ContractType.NEW, "신림빌라", "3", "-",
                new RentalSource("rent.csv", row));
    }
}
