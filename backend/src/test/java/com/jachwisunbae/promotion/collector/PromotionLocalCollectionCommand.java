package com.jachwisunbae.promotion.collector;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.jachwisunbae.promotion.controller.PromotionController;
import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.ProductCategory;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import com.jachwisunbae.promotion.domain.PromotionType;
import com.jachwisunbae.promotion.provider.PromotionFetcher;
import com.jachwisunbae.promotion.provider.emart24.Emart24PromotionClient;
import com.jachwisunbae.promotion.provider.emart24.Emart24PromotionFetcher;
import com.jachwisunbae.promotion.repository.JdbcPromotionProductRepository;
import com.jachwisunbae.promotion.service.PromotionCollectionService;
import com.jachwisunbae.promotion.service.PromotionQueryService;
import com.jachwisunbae.promotion.support.PromotionDatabaseTestConfiguration;
import com.jachwisunbae.promotion.support.PromotionProductsFixture;
import java.time.Clock;
import java.util.List;
import java.util.Set;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.MySQLContainer;

// 개발 전용 test classpath에서 실행한다. 외부 DB URL·프로필·DB_* 환경변수를 입력받지 않는다.
public class PromotionLocalCollectionCommand {

    public static void main(final String[] args) {
        validateArguments(args);
        PromotionFetcher fetcher = args[0].equals("--fixture")
                ? PromotionProductsFixture.fetcher(ConvenienceBrand.EMART24, PromotionProductsFixture::sample)
                : new Emart24PromotionFetcher(new Emart24PromotionClient());
        store(fetcher);
    }

    public static void store(final PromotionFetcher fetcher) {
        ConvenienceBrand brand = fetcher.brand();
        String host = DockerClientFactory.instance().dockerHostIpAddress();
        if (!Set.of("localhost", "127.0.0.1", "::1").contains(host)) {
            throw new IllegalStateException("로컬 Docker에서 생성한 일회용 MySQL만 사용할 수 있습니다.");
        }
        try (MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.4.10")
                .withDatabaseName("promotion_local").withUrlParam("rewriteBatchedStatements", "true").withReuse(false)) {
            mysql.start();
            DataSource dataSource = new DriverManagerDataSource(
                    mysql.getJdbcUrl(), mysql.getUsername(), mysql.getPassword());
            Flyway.configure().dataSource(dataSource).cleanDisabled(true).validateMigrationNaming(true).load().migrate();
            try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext()) {
                context.registerBean(DataSource.class, () -> dataSource);
                context.registerBean(Clock.class, Clock::systemUTC);
                context.registerBean(PromotionFetcher.class, () -> fetcher);
                context.register(PromotionDatabaseTestConfiguration.class);
                context.register(PromotionQueryService.class);
                context.refresh();
                System.out.println("[" + brand + "] 로컬 저장 검증 database=promotion_local (일회용)");
                JdbcPromotionProductRepository repository = context.getBean(JdbcPromotionProductRepository.class);
                System.out.println("DB 기존 데이터: " + repository.findByBrand(brand).size() + "건");
                context.getBean(PromotionCollectionService.class).collect(brand);
                List<PromotionProduct> stored = repository.findByBrand(brand);
                System.out.println("DB 신규 저장: " + stored.size() + "건");
                for (ProductCategory category : ProductCategory.values()) {
                    System.out.println(category.displayName() + ": "
                            + stored.stream().filter(product -> product.category() == category).count() + "건");
                }
                for (PromotionType type : PromotionType.values()) {
                    System.out.println(type.displayName() + ": "
                            + stored.stream().filter(product -> product.promotionType() == type).count() + "건");
                }
                System.out.println("마지막 정상 수집 시각(KST): "
                        + repository.findLastCollectedAt(brand).orElseThrow());
                System.out.println("실제 SQL 집계: " + new JdbcTemplate(dataSource).queryForList("""
                        SELECT brand, COUNT(*) AS product_count, MAX(collected_at) AS last_collected_at
                        FROM promotion_products GROUP BY brand
                        """));
                verifyApi(context.getBean(PromotionQueryService.class), brand, stored.size());
                System.out.println("[" + brand + "] 로컬 저장 검증 완료 (명령 종료 시 일회용 DB 삭제)");
            }
        }
    }

    private static void verifyApi(final PromotionQueryService service, final ConvenienceBrand brand, final int dbCount) {
        try {
            ObjectMapper mapper = Jackson2ObjectMapperBuilder.json()
                    .featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS).build();
            var response = MockMvcBuilders.standaloneSetup(new PromotionController(service))
                    .setMessageConverters(new MappingJackson2HttpMessageConverter(mapper)).build()
                    .perform(MockMvcRequestBuilders.get("/api/promotions").param("brand", brand.name()))
                    .andReturn().getResponse();
            var data = mapper.readTree(response.getContentAsByteArray()).path("data");
            if (response.getStatus() != 200 || data.path("count").asInt(-1) != dbCount
                    || data.path("products").size() != dbCount || !data.path("brand").asText().equals(brand.name())
                    || !data.path("collectedAt").asText().endsWith("+09:00")) {
                throw new IllegalStateException("조회 API의 브랜드·상품 수·KST 시각 형식이 실제 저장 결과와 다릅니다.");
            }
            System.out.println("API 검증(standalone MockMvc, JWT는 별도 통합 테스트): brand=" + brand
                    + ", dbCount=" + dbCount + ", count=" + data.path("count").asInt()
                    + ", collectedAt=" + data.path("collectedAt").asText());
        } catch (Exception exception) {
            throw new IllegalStateException("저장 후 조회 API 검증 실패", exception);
        }
    }

    static void validateArguments(final String[] args) {
        if (args.length != 1 || !Set.of("--fixture", "--live").contains(args[0])) {
            throw new IllegalArgumentException("모드를 지정하세요: --fixture | --live. 외부 DB 연결 옵션은 허용하지 않습니다.");
        }
    }
}
