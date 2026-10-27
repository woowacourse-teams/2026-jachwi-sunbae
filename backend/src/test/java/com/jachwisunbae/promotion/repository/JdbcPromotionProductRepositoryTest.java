package com.jachwisunbae.promotion.repository;

import static com.jachwisunbae.promotion.support.PromotionProductsFixture.product;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import com.jachwisunbae.promotion.provider.PromotionFetcher;
import com.jachwisunbae.promotion.service.PromotionCollectionService;
import com.jachwisunbae.promotion.support.PromotionDatabaseTestConfiguration;
import com.jachwisunbae.promotion.support.PromotionProductsFixture;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.aop.support.AopUtils;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
class JdbcPromotionProductRepositoryTest {

    private static final ConvenienceBrand BRAND = ConvenienceBrand.EMART24;
    private static final LocalDateTime FIRST_AT = LocalDateTime.of(2026, 10, 26, 4, 0, 0, 123456000);
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-27T04:00:00.123456Z"), ZoneOffset.UTC);

    @Container
    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4.10");

    private final PromotionFetcher fetcher = mock(PromotionFetcher.class);
    private AnnotationConfigApplicationContext context;
    private JdbcPromotionProductRepository repository;
    private JdbcTemplate jdbcTemplate;

    @BeforeAll
    static void migrate() {
        Flyway.configure().dataSource(dataSource(false)).cleanDisabled(true).validateMigrationNaming(true).load().migrate();
    }

    @BeforeEach
    void setUp() {
        openContext(false);
        jdbcTemplate.update("DELETE FROM promotion_products");
    }

    @AfterEach
    void closeContext() {
        context.close();
    }

    @Test
    @DisplayName("여러 배치의 상품과 수집 시각을 저장하고 원래 순서로 읽는다")
    void insertsAcrossBatchesAndReadsProducts() {
        List<PromotionProduct> products = IntStream.range(0, 1005).mapToObj(index -> product("상품" + index)).toList();

        assertThat(repository.replaceByBrand(BRAND, products, FIRST_AT)).isZero();

        assertThat(repository.findByBrand(BRAND)).containsExactlyElementsOf(products);
        assertThat(repository.findLastCollectedAt(BRAND)).contains(FIRST_AT);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(DISTINCT collected_at) FROM promotion_products", Integer.class))
                .isOne();
    }

    @Test
    @DisplayName("실제 Service의 중복 제거 결과와 MySQL 카테고리별 건수를 비교한다")
    void collectsFixtureAndQueriesCategoryCounts() {
        when(fetcher.fetch()).thenReturn(PromotionProductsFixture.sample());

        context.getBean(PromotionCollectionService.class).collect();

        assertThat(repository.findByBrand(BRAND)).hasSize(6);
        Map<String, Long> counts = jdbcTemplate.query("""
                SELECT category, COUNT(*) AS product_count FROM promotion_products WHERE brand = ? GROUP BY category
                """, result -> {
            Map<String, Long> values = new HashMap<>();
            while (result.next()) {
                values.put(result.getString("category"), result.getLong("product_count"));
            }
            return values;
        }, BRAND.name());
        assertThat(counts).containsExactlyInAnyOrderEntriesOf(
                Map.of("MEAL", 1L, "SNACK", 1L, "BEVERAGE", 3L, "HOUSEHOLD_GOODS", 1L));
        assertThat(repository.findLastCollectedAt(BRAND))
                .contains(LocalDateTime.of(2026, 10, 27, 13, 0, 0, 123456000));
    }

    @Test
    @DisplayName("같은 목록을 반복 저장해도 누적되지 않고 새 목록으로 기존 브랜드를 교체한다")
    void replacesRepeatedAndChangedSnapshots() {
        List<PromotionProduct> first = List.of(product("기존1"), product("기존2"));
        repository.replaceByBrand(BRAND, first, FIRST_AT);

        assertThat(repository.replaceByBrand(BRAND, first, FIRST_AT.plusDays(1))).isEqualTo(2);
        assertThat(repository.findByBrand(BRAND)).containsExactlyElementsOf(first);
        assertThat(repository.findLastCollectedAt(BRAND)).contains(FIRST_AT.plusDays(1));

        assertThat(repository.replaceByBrand(BRAND, List.of(product("신규")), FIRST_AT.plusDays(2))).isEqualTo(2);
        assertThat(repository.findByBrand(BRAND)).containsExactly(product("신규"));
    }

    @ParameterizedTest
    @EnumSource(value = ConvenienceBrand.class, names = "EMART24", mode = EnumSource.Mode.EXCLUDE)
    @DisplayName("이마트24를 교체해도 다른 브랜드의 행과 수집 시각은 유지한다")
    void keepsOtherBrands(final ConvenienceBrand otherBrand) {
        PromotionProduct base = product("보존 상품");
        PromotionProduct other = new PromotionProduct(otherBrand, base.name(), base.price(), base.imageUrl(),
                base.category(), base.promotionType());
        repository.replaceByBrand(otherBrand, List.of(other), FIRST_AT);
        repository.replaceByBrand(BRAND, List.of(product("기존")), FIRST_AT);

        repository.replaceByBrand(BRAND, List.of(product("신규")), FIRST_AT.plusDays(1));

        assertThat(repository.findByBrand(otherBrand)).containsExactly(other);
        assertThat(repository.findLastCollectedAt(otherBrand)).contains(FIRST_AT);
        assertThat(repository.findByBrand(BRAND)).containsExactly(product("신규"));
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    @DisplayName("DELETE와 첫 배치 이후 다음 배치가 실패해도 이전 행·ID·수집 시각을 실제로 롤백한다")
    void rollsBackDeleteAndSuccessfulBatchWhenLaterInsertFails(final boolean rewriteBatches) {
        context.close();
        openContext(rewriteBatches);
        repository.replaceByBrand(BRAND, List.of(product("이전 정상 상품")), FIRST_AT);
        List<Map<String, Object>> before = rows();
        List<PromotionProduct> invalid = new ArrayList<>(
                IntStream.range(0, 1000).mapToObj(index -> product("신규" + index)).toList());
        invalid.add(product("가".repeat(256))); // 첫 1000개 뒤의 두 번째 배치에서 VARCHAR(255) 제약 위반
        assertThat(AopUtils.isAopProxy(repository)).isTrue();

        assertThatThrownBy(() -> repository.replaceByBrand(BRAND, invalid, FIRST_AT.plusDays(1)))
                .isInstanceOf(DataIntegrityViolationException.class);

        assertThat(rows()).isEqualTo(before);
        assertThat(repository.findByBrand(BRAND)).containsExactly(product("이전 정상 상품"));
        assertThat(repository.findLastCollectedAt(BRAND)).contains(FIRST_AT);
    }

    @Test
    @DisplayName("빈 목록이나 브랜드가 다른 목록으로는 기존 행을 지우지 않는다")
    void rejectsInvalidReplacement() {
        repository.replaceByBrand(BRAND, List.of(product("이전 상품")), FIRST_AT);

        assertThatThrownBy(() -> repository.replaceByBrand(BRAND, List.of(), FIRST_AT.plusDays(1)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> repository.replaceByBrand(ConvenienceBrand.CU, List.of(product("신규")), FIRST_AT))
                .isInstanceOf(IllegalArgumentException.class);

        assertThat(repository.findByBrand(BRAND)).containsExactly(product("이전 상품"));
    }

    @Test
    @DisplayName("호출자 트랜잭션이 있어도 HTTP 수집은 트랜잭션 밖이고 저장은 별도로 커밋한다")
    void suspendsCallerTransactionDuringFetchAndCommitsReplacement() {
        PromotionCollectionService service = context.getBean(PromotionCollectionService.class);
        assertThat(AopUtils.isAopProxy(service)).isTrue();
        when(fetcher.fetch()).thenAnswer(invocation -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            return List.of(product("트랜잭션 밖에서 수집한 상품"));
        });
        TransactionTemplate transaction = new TransactionTemplate(context.getBean(PlatformTransactionManager.class));

        transaction.executeWithoutResult(status -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isTrue();
            service.collect();
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isTrue();
            status.setRollbackOnly();
        });

        assertThat(repository.findByBrand(BRAND)).containsExactly(product("트랜잭션 밖에서 수집한 상품"));
    }

    @Test
    @DisplayName("HTTP 실패와 빈 수집 결과 모두 마지막 정상 DB 스냅샷을 유지한다")
    void preservesStoredSnapshotWhenFetchFailsOrReturnsEmpty() {
        repository.replaceByBrand(BRAND, List.of(product("보존 상품")), FIRST_AT);
        List<Map<String, Object>> before = rows();
        when(fetcher.fetch()).thenThrow(new IllegalStateException("upstream failure")).thenReturn(List.of());
        PromotionCollectionService service = context.getBean(PromotionCollectionService.class);

        assertThatThrownBy(service::collect).isInstanceOf(IllegalStateException.class);
        assertThat(rows()).isEqualTo(before);
        assertThatThrownBy(service::collect).isInstanceOf(UpstreamServiceException.class);
        assertThat(rows()).isEqualTo(before);
    }

    @Test
    @DisplayName("저장 전 마지막 수집 시각은 없고 신규 마이그레이션의 컬럼·인덱스가 적용된다")
    void appliesMigrationAndHasNoCollectionTimestampBeforeStoring() {
        assertThat(repository.findLastCollectedAt(BRAND)).isEmpty();
        assertThat(jdbcTemplate.queryForList("""
                SELECT column_name FROM information_schema.columns
                WHERE table_schema = DATABASE() AND table_name = 'promotion_products' ORDER BY ordinal_position
                """, String.class)).containsExactly("id", "brand", "name", "price", "image_url", "category",
                "promotion_type", "collected_at");
        assertThat(jdbcTemplate.queryForList("""
                SELECT column_name FROM information_schema.statistics
                WHERE table_schema = DATABASE() AND table_name = 'promotion_products'
                  AND index_name = 'idx_promotion_products_brand_category' ORDER BY seq_in_index
                """, String.class)).containsExactly("brand", "category");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT success FROM flyway_schema_history WHERE version = '6'", Boolean.class)).isTrue();
    }

    @Test
    @DisplayName("V5 DB에서 V6만 추가 적용하면 기존 날씨 기록을 유지하고 빈 행사상품 테이블을 만든다")
    void upgradesV5WithoutChangingExistingWeatherData() {
        JdbcTemplate admin = new JdbcTemplate(new DriverManagerDataSource(MYSQL.getJdbcUrl(), "root", MYSQL.getPassword()));
        admin.execute("CREATE DATABASE promotion_upgrade");
        DataSource oldDatabase = new DriverManagerDataSource(
                "jdbc:mysql://" + MYSQL.getHost() + ":" + MYSQL.getMappedPort(3306) + "/promotion_upgrade",
                "root", MYSQL.getPassword());
        Flyway.configure().dataSource(oldDatabase).target("5").load().migrate();
        JdbcTemplate oldJdbc = new JdbcTemplate(oldDatabase);
        oldJdbc.update("INSERT INTO weather_collection_publications (published_at, completed_at) VALUES (?, ?)",
                FIRST_AT, FIRST_AT.plusMinutes(15));
        var before = oldJdbc.queryForList("SELECT * FROM weather_collection_publications");
        Flyway latest = Flyway.configure().dataSource(oldDatabase).load();

        assertThat(latest.migrate().migrationsExecuted).isOne();

        assertThat(oldJdbc.queryForList("SELECT * FROM weather_collection_publications")).isEqualTo(before);
        assertThat(oldJdbc.queryForObject("SELECT COUNT(*) FROM promotion_products", Integer.class)).isZero();
        latest.validate();
        assertThat(latest.migrate().migrationsExecuted).isZero();
    }

    private List<Map<String, Object>> rows() {
        return jdbcTemplate.queryForList("SELECT * FROM promotion_products ORDER BY id");
    }

    private void openContext(final boolean rewriteBatches) {
        DataSource dataSource = dataSource(rewriteBatches);
        context = new AnnotationConfigApplicationContext();
        context.registerBean(DataSource.class, () -> dataSource);
        context.registerBean(Clock.class, () -> CLOCK);
        context.registerBean(PromotionFetcher.class, () -> fetcher);
        context.register(PromotionDatabaseTestConfiguration.class);
        context.refresh();
        repository = context.getBean(JdbcPromotionProductRepository.class);
        jdbcTemplate = context.getBean(JdbcTemplate.class);
    }

    private static DataSource dataSource(final boolean rewriteBatches) {
        String url = MYSQL.getJdbcUrl();
        return new DriverManagerDataSource(url + (url.contains("?") ? "&" : "?")
                + "rewriteBatchedStatements=" + rewriteBatches, MYSQL.getUsername(), MYSQL.getPassword());
    }
}
