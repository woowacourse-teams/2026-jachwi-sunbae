package com.jachwisunbae.rental.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.LongStream;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.JdbcTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
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
    private static final MySQLContainer<?> mysqlContainer = new MySQLContainer<>("mysql:8.4.10");

    private static final LegalDong SILLIM = new LegalDong("1162010200", "서울특별시 관악구 신림동");
    private static final LocalDate PERIOD_START = LocalDate.parse("2026-04-10");
    private static final LocalDate PERIOD_END = LocalDate.parse("2026-10-09");

    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private DataSource dataSource;

    private RentalImportService service;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM admin_dong_rents");
        jdbcTemplate.update("DELETE FROM admin_legal_dongs");
        jdbcTemplate.update("DELETE FROM rental_transactions");
        jdbcTemplate.update("DELETE FROM rental_datasets");
        jdbcTemplate.update("DELETE FROM legal_dongs");
        service = new RentalImportService(new JdbcRentalTransactionRepository(jdbcTemplate),
                new AdminDongRentService(new JdbcAdminDongRentRepository(jdbcTemplate)),
                new TransactionTemplate(new DataSourceTransactionManager(dataSource)));
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
