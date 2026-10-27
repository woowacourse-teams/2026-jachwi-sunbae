package com.jachwisunbae.promotion.service;

import static com.jachwisunbae.promotion.support.PromotionProductsFixture.product;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import com.jachwisunbae.promotion.repository.JdbcPromotionProductRepository;
import com.jachwisunbae.promotion.service.dto.result.PromotionProductsResult;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.dao.DataAccessResourceFailureException;

class PromotionQueryServiceTest {

    private static final LocalDateTime COLLECTED_AT = LocalDateTime.of(2026, 10, 27, 14, 14, 47, 123456000);

    private final JdbcPromotionProductRepository repository = mock(JdbcPromotionProductRepository.class);
    private final PromotionQueryService service = new PromotionQueryService(repository);

    @ParameterizedTest
    @EnumSource(ConvenienceBrand.class)
    @DisplayName("지정한 브랜드의 전체 상품과 수집 시각을 저장 순서대로 반환하고 조회 시 중복 제거하지 않는다")
    void returnsAllStoredProductsAndTimestamp(final ConvenienceBrand brand) {
        PromotionProduct base = product("첫 상품");
        PromotionProduct first = new PromotionProduct(brand, base.name(), base.price(), base.imageUrl(),
                base.category(), base.promotionType());
        PromotionProduct second = new PromotionProduct(brand, "다음 상품", 2000, base.imageUrl(),
                base.category(), base.promotionType());
        List<PromotionProduct> products = List.of(second, first, second);
        when(repository.findByBrand(brand)).thenReturn(products);
        when(repository.findLastCollectedAt(brand)).thenReturn(Optional.of(COLLECTED_AT));

        PromotionProductsResult result = service.findByBrand(brand);

        assertThat(result.brand()).isEqualTo(brand);
        assertThat(result.products()).containsExactly(second, first, second);
        assertThat(result.collectedAt()).isEqualTo(COLLECTED_AT);
        verify(repository).findByBrand(brand);
        verify(repository).findLastCollectedAt(brand);
        verifyNoMoreInteractions(repository);
    }

    @Test
    @DisplayName("미수집 브랜드는 빈 목록과 null 시각을 반환한다")
    void returnsEmptyUncollectedBrand() {
        when(repository.findByBrand(ConvenienceBrand.CU)).thenReturn(List.of());
        when(repository.findLastCollectedAt(ConvenienceBrand.CU)).thenReturn(Optional.empty());

        PromotionProductsResult result = service.findByBrand(ConvenienceBrand.CU);

        assertThat(result.brand()).isEqualTo(ConvenienceBrand.CU);
        assertThat(result.products()).isEmpty();
        assertThat(result.collectedAt()).isNull();
        verify(repository).findByBrand(ConvenienceBrand.CU);
        verify(repository).findLastCollectedAt(ConvenienceBrand.CU);
        verifyNoMoreInteractions(repository);
    }

    @Test
    @DisplayName("상품 조회 오류를 빈 목록으로 숨기지 않는다")
    void propagatesProductReadFailure() {
        DataAccessResourceFailureException failure = new DataAccessResourceFailureException("read failed");
        when(repository.findByBrand(ConvenienceBrand.EMART24)).thenThrow(failure);

        assertThatThrownBy(() -> service.findByBrand(ConvenienceBrand.EMART24)).isSameAs(failure);
        verify(repository).findByBrand(ConvenienceBrand.EMART24);
        verifyNoMoreInteractions(repository);
    }

    @Test
    @DisplayName("수집 시각 조회 오류도 정상 빈 결과로 바꾸지 않는다")
    void propagatesTimestampReadFailure() {
        when(repository.findByBrand(ConvenienceBrand.EMART24)).thenReturn(List.of(product("상품")));
        DataAccessResourceFailureException failure = new DataAccessResourceFailureException("timestamp read failed");
        when(repository.findLastCollectedAt(ConvenienceBrand.EMART24)).thenThrow(failure);

        assertThatThrownBy(() -> service.findByBrand(ConvenienceBrand.EMART24)).isSameAs(failure);
    }
}
