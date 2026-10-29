package com.jachwisunbae.promotion.service;

import static com.jachwisunbae.promotion.support.PromotionProductsFixture.product;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.ProductCategory;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import com.jachwisunbae.promotion.domain.PromotionType;
import com.jachwisunbae.promotion.provider.PromotionFetcher;
import com.jachwisunbae.promotion.repository.JdbcPromotionProductRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

@ExtendWith(OutputCaptureExtension.class)
class PromotionCollectionServiceTest {

    private static final ConvenienceBrand BRAND = ConvenienceBrand.EMART24;
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-27T04:00:00.123456Z"), ZoneOffset.UTC);
    private static final LocalDateTime COLLECTED_AT = LocalDateTime.of(2026, 10, 27, 13, 0, 0, 123456000);

    private static final ConvenienceBrand OTHER_BRAND = ConvenienceBrand.SEVEN_ELEVEN;

    private final PromotionFetcher fetcher = fetcher(BRAND);
    private final PromotionFetcher otherFetcher = fetcher(OTHER_BRAND);
    private final JdbcPromotionProductRepository repository = mock(JdbcPromotionProductRepository.class);
    private final PromotionCollectionService service =
            new PromotionCollectionService(List.of(fetcher), repository, CLOCK);
    private final PromotionCollectionService multiBrandService =
            new PromotionCollectionService(List.of(fetcher, otherFetcher), repository, CLOCK);

    @Test
    @DisplayName("모든 필드가 같은 항목만 제거하고 처음 수집한 순서로 KST 수집 시각과 함께 저장한다")
    void deduplicatesExactProductsAndLogsCounts(final CapturedOutput output) {
        PromotionProduct base = product("같은 이름");
        PromotionProduct otherPromotion = new PromotionProduct(BRAND, base.name(), base.price(), base.imageUrl(),
                base.category(), PromotionType.TWO_PLUS_ONE);
        PromotionProduct otherPrice = new PromotionProduct(BRAND, base.name(), 1000, base.imageUrl(),
                base.category(), base.promotionType());
        PromotionProduct otherImage = new PromotionProduct(BRAND, base.name(), base.price(),
                "https://example.com/other.jpg", base.category(), base.promotionType());
        PromotionProduct otherCategory = new PromotionProduct(BRAND, base.name(), base.price(), base.imageUrl(),
                ProductCategory.SNACK, base.promotionType());
        PromotionProduct otherName = product("다른 이름");
        when(fetcher.fetch()).thenReturn(List.of(base, otherPromotion, base, otherPrice, otherImage, otherCategory,
                otherName, otherName));

        service.collect();

        verify(repository).replaceByBrand(BRAND,
                List.of(base, otherPromotion, otherPrice, otherImage, otherCategory, otherName), COLLECTED_AT);
        assertThat(output).contains("success=true rawCount=8 duplicateCount=2 storedCount=6",
                "collectedAt=2026-10-27T13:00:00.123456");
    }

    @Test
    @DisplayName("수집이 실패하면 저장소를 호출하지 않고 실패를 전파한다")
    void doesNotStoreFailedCollection(final CapturedOutput output) {
        UpstreamServiceException failure = new UpstreamServiceException(ErrorCode.PROMOTION_PROVIDER_UNAVAILABLE,
                "HTTP status=429");
        when(fetcher.fetch()).thenThrow(failure);

        assertThatThrownBy(service::collect).isSameAs(failure);

        verifyNoInteractions(repository);
        assertThat(output).contains("success=false exceptionType=UpstreamServiceException")
                .doesNotContain("success=true");
    }

    @Test
    @DisplayName("빈 수집 결과로는 기존 데이터 교체를 요청하지 않는다")
    void rejectsEmptyCollection() {
        when(fetcher.fetch()).thenReturn(List.of());

        assertThatThrownBy(service::collect).isInstanceOfSatisfying(UpstreamServiceException.class,
                exception -> assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.PROMOTION_RESPONSE_INVALID));
        verifyNoInteractions(repository);
    }

    @Test
    @DisplayName("다른 브랜드 상품이 섞인 수집 결과로는 기존 데이터 교체를 요청하지 않는다")
    void rejectsOtherBrandProducts() {
        when(fetcher.fetch()).thenReturn(List.of(product("상품"), product(OTHER_BRAND, "다른 브랜드 상품")));

        assertThatThrownBy(service::collect).isInstanceOfSatisfying(UpstreamServiceException.class,
                exception -> assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.PROMOTION_RESPONSE_INVALID));
        verifyNoInteractions(repository);
    }

    @Test
    @DisplayName("특정 브랜드를 지정하면 해당 브랜드의 수집기만 실행한다")
    void collectsSelectedBrandOnly() {
        when(otherFetcher.fetch()).thenReturn(List.of(product(OTHER_BRAND, "상품")));

        multiBrandService.collect(OTHER_BRAND);

        verify(fetcher, never()).fetch();
        verify(repository).replaceByBrand(OTHER_BRAND, List.of(product(OTHER_BRAND, "상품")), COLLECTED_AT);
    }

    @Test
    @DisplayName("등록된 수집기가 없는 브랜드는 수집하지 않는다")
    void rejectsUnregisteredBrand() {
        assertThatThrownBy(() -> service.collect(OTHER_BRAND)).isInstanceOf(IllegalArgumentException.class);

        verifyNoInteractions(repository);
    }

    @Test
    @DisplayName("같은 브랜드의 수집기가 둘이면 생성하지 않는다")
    void rejectsDuplicateBrandFetchers() {
        assertThatThrownBy(() -> new PromotionCollectionService(List.of(fetcher, fetcher(BRAND)), repository, CLOCK))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("한 브랜드 수집이 실패해도 다른 브랜드를 저장하고 첫 실패를 전파한다")
    void collectsOtherBrandsWhenOneFails() {
        UpstreamServiceException failure = new UpstreamServiceException(ErrorCode.PROMOTION_PROVIDER_UNAVAILABLE,
                "HTTP status=429");
        when(fetcher.fetch()).thenThrow(failure);
        when(otherFetcher.fetch()).thenReturn(List.of(product(OTHER_BRAND, "상품")));

        assertThatThrownBy(multiBrandService::collect).isSameAs(failure);

        verify(repository, never()).replaceByBrand(eq(BRAND), any(), any());
        verify(repository).replaceByBrand(OTHER_BRAND, List.of(product(OTHER_BRAND, "상품")), COLLECTED_AT);
    }

    @Test
    @DisplayName("최초 수집은 지정한 브랜드만 확인하고 다른 브랜드는 수집하지 않는다")
    void collectsInitiallyOnlyGivenBrand() {
        when(repository.findLastCollectedAt(BRAND)).thenReturn(Optional.empty());
        when(fetcher.fetch()).thenReturn(List.of(product("상품")));

        multiBrandService.collectIfEmpty(BRAND);

        verify(repository).replaceByBrand(BRAND, List.of(product("상품")), COLLECTED_AT);
        verify(repository, never()).findLastCollectedAt(OTHER_BRAND);
        verify(otherFetcher, never()).fetch();
    }

    @Test
    @DisplayName("저장된 목록이 없으면 최초 수집을 실행한다")
    void collectsInitiallyWhenEmpty() {
        when(repository.findLastCollectedAt(BRAND)).thenReturn(Optional.empty());
        when(fetcher.fetch()).thenReturn(List.of(product("상품")));

        service.collectIfEmpty(BRAND);

        verify(repository).replaceByBrand(BRAND, List.of(product("상품")), COLLECTED_AT);
    }

    @Test
    @DisplayName("저장된 목록이 있으면 최초 수집을 건너뛴다")
    void skipsInitialCollectionWhenCollected() {
        when(repository.findLastCollectedAt(BRAND)).thenReturn(Optional.of(COLLECTED_AT));

        service.collectIfEmpty(BRAND);

        verify(fetcher, never()).fetch();
        verify(repository, never()).replaceByBrand(any(), any(), any());
    }

    @Test
    @DisplayName("저장 실패는 성공 로그 없이 전파한다")
    void reportsStorageFailure(final CapturedOutput output) {
        when(fetcher.fetch()).thenReturn(List.of(product("상품")));
        IllegalStateException failure = new IllegalStateException("storage failure");
        when(repository.replaceByBrand(eq(BRAND), any(), eq(COLLECTED_AT))).thenThrow(failure);

        assertThatThrownBy(service::collect).isSameAs(failure);

        assertThat(output).contains("success=false exceptionType=IllegalStateException").doesNotContain("success=true");
    }

    private static PromotionFetcher fetcher(final ConvenienceBrand brand) {
        PromotionFetcher fetcher = mock(PromotionFetcher.class);
        when(fetcher.brand()).thenReturn(brand);
        return fetcher;
    }
}
