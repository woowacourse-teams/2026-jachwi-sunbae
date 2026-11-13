package com.jachwisunbae.rental.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.jachwisunbae.rental.domain.ContractType;
import com.jachwisunbae.rental.domain.HousingType;
import com.jachwisunbae.rental.domain.RentalSnapshot;
import com.jachwisunbae.rental.domain.RentalTransaction;
import com.jachwisunbae.rental.domain.vo.LegalDong;
import com.jachwisunbae.rental.domain.vo.RentalArea;
import com.jachwisunbae.rental.domain.vo.RentalPrice;
import com.jachwisunbae.rental.domain.vo.RentalSource;
import com.jachwisunbae.rental.repository.query.RentalDatasetInfo;
import com.jachwisunbae.rental.repository.query.RentalTransactionEntry;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.JdbcTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class JdbcRentalTransactionRepositoryTest {

    @Container
    @ServiceConnection
    private static final MySQLContainer<?> mysqlContainer = new MySQLContainer<>("mysql:8.4.10");

    private static final String DATASET_KEY = RentalSnapshot.DATASET_KEY;
    private static final LegalDong SILLIM = new LegalDong("1162010200", "서울특별시 관악구 신림동");
    private static final LegalDong BONGCHEON = new LegalDong("1162010100", "서울특별시 관악구 봉천동");
    private static final RentalSnapshot SNAPSHOT = new RentalSnapshot(DATASET_KEY, "a".repeat(64), "b".repeat(64),
            LocalDate.parse("2026-04-10"), LocalDate.parse("2026-10-09"), Instant.parse("2026-10-10T03:00:00Z"));

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private JdbcRentalTransactionRepository repository;

    @BeforeEach
    void setUp() {
        repository = new JdbcRentalTransactionRepository(jdbcTemplate);
        repository.createDatasetIfAbsent(DATASET_KEY);
    }

    @Test
    @DisplayName("수집본 행을 만들어도 해시가 채워지기 전에는 수집본과 수집 정보가 없다")
    void hasNoSnapshotBeforeFirstImport() {
        // given
        repository.createDatasetIfAbsent(DATASET_KEY);

        // when // then
        assertThat(repository.findSnapshotForUpdate(DATASET_KEY)).isEmpty();
        assertThat(repository.findDatasetInfo()).isEmpty();
    }

    @Test
    @DisplayName("수집본 정보를 저장하면 같은 값으로 다시 읽는다")
    void updatesAndRestoresSnapshot() {
        // given
        repository.updateSnapshot(SNAPSHOT, 3);

        // when // then
        assertThat(repository.findSnapshotForUpdate(DATASET_KEY)).contains(SNAPSHOT);
        assertThat(repository.findDatasetInfo()).contains(new RentalDatasetInfo(SNAPSHOT.datasetPeriodStart(),
                SNAPSHOT.datasetPeriodEnd(), SNAPSHOT.collectedAt()));
        assertThat(jdbcTemplate.queryForObject("SELECT row_count FROM rental_datasets WHERE dataset_key = ?",
                Integer.class, DATASET_KEY)).isEqualTo(3);
    }

    @Test
    @DisplayName("법정동은 코드가 같으면 이름을 새 값으로 바꾼다")
    void upsertsLegalDongNames() {
        // given
        repository.upsertLegalDongs(List.of(new LegalDong(SILLIM.code(), "옛 이름")));

        // when
        repository.upsertLegalDongs(List.of(SILLIM, SILLIM, BONGCHEON));

        // then
        assertThat(repository.findLegalDongName(SILLIM.code())).contains(SILLIM.name());
        assertThat(repository.findLegalDongName(BONGCHEON.code())).contains(BONGCHEON.name());
        assertThat(repository.findLegalDongName("9999999999")).isEmpty();
    }

    @Test
    @DisplayName("법정동 거래를 기간 안에서 최신 계약일, 최신 ID 순으로 페이지를 나눠 읽는다")
    void findsPageInLatestOrder() {
        // given
        repository.upsertLegalDongs(List.of(SILLIM, BONGCHEON));
        repository.saveAll(DATASET_KEY, List.of(
                transaction(SILLIM, "2026-04-09", 1),
                transaction(SILLIM, "2026-04-10", 2),
                transaction(SILLIM, "2026-10-09", 3),
                transaction(SILLIM, "2026-10-09", 4),
                transaction(SILLIM, "2026-10-10", 5),
                transaction(BONGCHEON, "2026-10-09", 6)));
        LocalDate start = LocalDate.parse("2026-04-10");
        LocalDate end = LocalDate.parse("2026-10-09");

        // when
        List<RentalTransactionEntry> firstPage = repository.findPageByLegalDongCode(SILLIM.code(), start, end, 2, 0);
        List<RentalTransactionEntry> secondPage = repository.findPageByLegalDongCode(SILLIM.code(), start, end, 2, 2);

        // then
        assertThat(repository.countByLegalDongCode(SILLIM.code(), start, end)).isEqualTo(3);
        assertThat(firstPage).extracting(entry -> entry.transaction().source().sourceRowNumber())
                .containsExactly(4L, 3L);
        assertThat(firstPage.get(0).rentalTransactionId()).isGreaterThan(firstPage.get(1).rentalTransactionId());
        assertThat(secondPage).extracting(entry -> entry.transaction().source().sourceRowNumber())
                .containsExactly(2L);
        assertThat(firstPage.getFirst().transaction()).isEqualTo(transaction(SILLIM, "2026-10-09", 4));
    }

    @Test
    @DisplayName("수집본의 거래를 세고 모두 지운다")
    void countsAndDeletesByDataset() {
        // given
        repository.upsertLegalDongs(List.of(SILLIM));
        repository.saveAll(DATASET_KEY, List.of(transaction(SILLIM, "2026-10-01", 1),
                transaction(SILLIM, "2026-10-02", 2)));

        // when
        long before = repository.countByDatasetKey(DATASET_KEY);
        repository.deleteByDatasetKey(DATASET_KEY);

        // then
        assertThat(before).isEqualTo(2);
        assertThat(repository.countByDatasetKey(DATASET_KEY)).isZero();
    }

    @Test
    @DisplayName("최근 거래를 개수만큼 거래로만 읽는다")
    void findsLatestTransactions() {
        // given
        repository.upsertLegalDongs(List.of(SILLIM));
        repository.saveAll(DATASET_KEY, List.of(transaction(SILLIM, "2026-10-01", 1),
                transaction(SILLIM, "2026-10-02", 2)));

        // when
        List<RentalTransaction> transactions = repository.findByLegalDongCode(SILLIM.code(),
                LocalDate.parse("2026-04-10"), LocalDate.parse("2026-10-09"), 1);

        // then
        assertThat(transactions).containsExactly(transaction(SILLIM, "2026-10-02", 2));
    }

    private RentalTransaction transaction(final LegalDong legalDong, final String contractDate, final long row) {
        return new RentalTransaction(legalDong, HousingType.ROWHOUSE, new RentalPrice(5_000_000L, 450_000L),
                new RentalArea(new BigDecimal("20.0000"), HousingType.ROWHOUSE.areaBasis()),
                LocalDate.parse(contractDate), ContractType.NEW, "신림빌라", "3", "-",
                new RentalSource("rent.csv", row));
    }
}
