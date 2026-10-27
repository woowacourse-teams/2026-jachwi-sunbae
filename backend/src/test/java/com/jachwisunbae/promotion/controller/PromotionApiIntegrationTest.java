package com.jachwisunbae.promotion.controller;

import static com.jachwisunbae.promotion.support.PromotionProductsFixture.product;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doCallRealMethod;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jachwisunbae.auth.token.JwtTokenProvider;
import com.jachwisunbae.common.web.ApiResponse;
import com.jachwisunbae.promotion.controller.dto.response.PromotionProductsResponse;
import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import com.jachwisunbae.promotion.provider.emart24.Emart24PromotionClient;
import com.jachwisunbae.promotion.repository.JdbcPromotionProductRepository;
import com.jachwisunbae.promotion.service.PromotionCollectionService;
import com.jachwisunbae.promotion.service.PromotionQueryService;
import com.jachwisunbae.promotion.support.PromotionProductsFixture;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.IntStream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PromotionApiIntegrationTest {

    private static final ConvenienceBrand BRAND = ConvenienceBrand.EMART24;
    private static final LocalDateTime COLLECTED_AT = LocalDateTime.of(2026, 10, 27, 14, 14, 47);

    @Container
    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4.10")
            .withUrlParam("rewriteBatchedStatements", "true");

    @Autowired
    private MockMvc mvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private JwtTokenProvider tokens;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private PromotionQueryService service;
    @MockitoSpyBean
    private JdbcPromotionProductRepository repository;
    @MockitoBean
    private PromotionCollectionService collection;
    @MockitoBean
    private Emart24PromotionClient client;

    @DynamicPropertySource
    static void database(final DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
    }

    @BeforeEach
    void clearProducts() {
        jdbc.update("DELETE FROM promotion_products");
    }

    @AfterEach
    void verifiesReadOnlyRequestDoesNotCollect() {
        verifyNoInteractions(collection, client);
    }

    @Test
    @DisplayName("익명 로그인 JWT로 저장된 브랜드의 상품 전체를 순서대로 조회하고 응답 전용 필드만 반환한다")
    void returnsStoredProductsWithAnonymousLoginToken() throws Exception {
        List<PromotionProduct> products = List.of(product("먼저 저장한 상품"), product("다음 상품"));
        repository.replaceByBrand(BRAND, products, COLLECTED_AT);
        repository.replaceByBrand(ConvenienceBrand.CU, List.of(withBrand(product("다른 브랜드"), ConvenienceBrand.CU)),
                COLLECTED_AT.plusHours(1));
        var login = mvc.perform(post("/api/auth/login")).andExpect(status().isOk()).andReturn().getResponse();
        String accessToken = objectMapper.readTree(login.getContentAsString()).path("data").path("accessToken").asText();

        mvc.perform(get("/api/promotions").param("brand", "EMART24").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.message").value("요청이 성공했습니다."))
                .andExpect(jsonPath("$.data.brand").value("EMART24"))
                .andExpect(jsonPath("$.data.count").value(2))
                .andExpect(jsonPath("$.data.products.length()").value(2))
                .andExpect(jsonPath("$.data.products[0].name").value("먼저 저장한 상품"))
                .andExpect(jsonPath("$.data.products[1].name").value("다음 상품"))
                .andExpect(jsonPath("$.data.products[0].price").value(3000))
                .andExpect(jsonPath("$.data.products[0].imageUrl").value("https://example.com/product.jpg"))
                .andExpect(jsonPath("$.data.products[0].category").value("MEAL"))
                .andExpect(jsonPath("$.data.products[0].promotionType").value("ONE_PLUS_ONE"))
                .andExpect(jsonPath("$.data.products[0].length()").value(5))
                .andExpect(jsonPath("$.data.products[0].id").doesNotExist())
                .andExpect(jsonPath("$.data.products[0].brand").doesNotExist())
                .andExpect(jsonPath("$.data.collectedAt").value("2026-10-27T14:14:47+09:00"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"EMART24", "CU", "GS25", "SEVEN_ELEVEN"})
    @DisplayName("지원하는 브랜드가 미수집이면 200과 빈 목록·null 시각을 반환한다")
    void returnsEmptyUncollectedBrand(final String brand) throws Exception {
        mvc.perform(get("/api/promotions").param("brand", brand).header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.brand").value(brand))
                .andExpect(jsonPath("$.data.count").value(0))
                .andExpect(jsonPath("$.data.products").isEmpty())
                .andExpect(jsonPath("$.data.collectedAt").value(nullValue()));
    }

    @ParameterizedTest
    @ValueSource(strings = {"UNKNOWN", "emart24", ""})
    @DisplayName("잘못된 enum 값과 빈 브랜드는 기존 입력 오류 응답을 따른다")
    void rejectsInvalidBrand(final String brand) throws Exception {
        mvc.perform(get("/api/promotions").param("brand", brand).header("Authorization", bearer()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.errors[0].field").value("brand"));
    }

    @Test
    @DisplayName("필수 브랜드가 누락되면 400을 반환한다")
    void rejectsMissingBrand() throws Exception {
        mvc.perform(get("/api/promotions").header("Authorization", bearer()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.errors[0].field").value("brand"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "Bearer invalid-token", "Basic test"})
    @DisplayName("기존 JWT 필터는 미인증·잘못된 토큰의 행사상품 요청을 401로 거부한다")
    void requiresJwt(final String authorization) throws Exception {
        var request = get("/api/promotions").param("brand", "EMART24");
        if (!authorization.isEmpty()) {
            request.header("Authorization", authorization);
        }
        mvc.perform(request).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("ACCESS_TOKEN_INVALID"));
    }

    @Test
    @DisplayName("KST 자정과 마이크로초를 시간 이동 없이 +09:00으로 직렬화한다")
    void preservesKstMidnightAndFraction() throws Exception {
        repository.replaceByBrand(BRAND, List.of(product("상품")), LocalDateTime.of(2026, 10, 27, 0, 0, 0, 123456000));

        mvc.perform(get("/api/promotions").param("brand", "EMART24").header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.collectedAt").value("2026-10-27T00:00:00.123456+09:00"));
    }

    @Test
    @DisplayName("DB 조회 실패를 성공 빈 목록으로 바꾸지 않는다")
    void reportsDatabaseReadFailure() throws Exception {
        doThrow(new DataAccessResourceFailureException("simulated database failure")).when(repository).findByBrand(BRAND);

        mvc.perform(get("/api/promotions").param("brand", "EMART24").header("Authorization", bearer()))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("INTERNAL_SERVER_ERROR"));
    }

    @Test
    @DisplayName("두 조회 사이에 새 목록이 커밋되어도 응답의 상품과 수집 시각은 같은 스냅샷이다")
    void readsProductsAndTimestampFromSameSnapshot() throws Exception {
        repository.replaceByBrand(BRAND, List.of(product("이전 상품")), COLLECTED_AT);
        try (var executor = Executors.newSingleThreadExecutor()) {
            doAnswer(invocation -> {
                Object original = invocation.callRealMethod();
                executor.submit(() -> repository.replaceByBrand(BRAND, List.of(product("새 상품")), COLLECTED_AT.plusDays(1)))
                        .get(5, TimeUnit.SECONDS);
                return original;
            }).when(repository).findByBrand(BRAND);

            mvc.perform(get("/api/promotions").param("brand", "EMART24").header("Authorization", bearer()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.products[0].name").value("이전 상품"))
                    .andExpect(jsonPath("$.data.collectedAt").value("2026-10-27T14:14:47+09:00"));
        }
        doCallRealMethod().when(repository).findByBrand(BRAND);
        assertThat(repository.findByBrand(BRAND)).containsExactly(product("새 상품"));
    }

    @Test
    @DisplayName("Swagger에 필수 enum 파라미터·JWT·응답·오류와 오프셋 시각을 문서화한다")
    void publishesOpenApiContract() throws Exception {
        mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/promotions'].get.security[0].bearerAuth").isArray())
                .andExpect(jsonPath("$.paths['/api/promotions'].get.parameters[0].name").value("brand"))
                .andExpect(jsonPath("$.paths['/api/promotions'].get.parameters[0].required").value(true))
                .andExpect(jsonPath("$.paths['/api/promotions'].get.parameters[0].schema.enum.length()").value(4))
                .andExpect(jsonPath("$.paths['/api/promotions'].get.responses['200'].content['application/json'].schema").exists())
                .andExpect(jsonPath("$.paths['/api/promotions'].get.responses['400']").exists())
                .andExpect(jsonPath("$.paths['/api/promotions'].get.responses['401']").exists())
                .andExpect(jsonPath("$.components.schemas.PromotionProductsResponse.properties.collectedAt.format").value("date-time"))
                .andExpect(jsonPath("$.components.schemas.PromotionProductResponse.properties.id").doesNotExist());
    }

    @ParameterizedTest
    @ValueSource(ints = {6, 2337})
    @DisplayName("로컬 MySQL fixture 전체 조회와 JSON 크기·시간을 측정하며 페이지 제한을 두지 않는다")
    void measuresLocalFixtureResponse(final int count) throws Exception {
        List<PromotionProduct> products = count == 6 ? PromotionProductsFixture.sample().stream().distinct().toList()
                : IntStream.range(0, count).mapToObj(index -> product("측정용 상품 " + index)).toList();
        repository.replaceByBrand(BRAND, products, COLLECTED_AT);

        long queryStarted = System.nanoTime();
        var result = service.findByBrand(BRAND);
        double queryMillis = (System.nanoTime() - queryStarted) / 1_000_000.0;
        var response = ApiResponse.of(PromotionProductsResponse.from(result));
        long serializationStarted = System.nanoTime();
        byte[] json = objectMapper.writeValueAsBytes(response);
        double serializationMillis = (System.nanoTime() - serializationStarted) / 1_000_000.0;

        assertThat(response.data().count()).isEqualTo(count);
        assertThat(result.products()).containsExactlyElementsOf(products);
        mvc.perform(get("/api/promotions").param("brand", "EMART24").header("Authorization", bearer()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.products.length()").value(count))
                .andExpect(jsonPath("$.data.count").value(count));
        System.out.printf("promotion-api-measurement source=synthetic-local-mysql count=%d jsonBytes=%d queryMillis=%.3f "
                        + "serializationMillis=%.3f%n", count, json.length, queryMillis, serializationMillis);
        if (count == 6) {
            System.out.println("promotion-api-fixture-response=" + new String(json, StandardCharsets.UTF_8));
        }
    }

    private String bearer() {
        return "Bearer " + tokens.createAccessToken(1L);
    }

    private PromotionProduct withBrand(final PromotionProduct product, final ConvenienceBrand brand) {
        return new PromotionProduct(brand, product.name(), product.price(), product.imageUrl(), product.category(),
                product.promotionType());
    }
}
