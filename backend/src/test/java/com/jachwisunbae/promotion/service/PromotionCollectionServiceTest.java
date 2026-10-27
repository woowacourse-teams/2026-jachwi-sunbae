package com.jachwisunbae.promotion.service;

import static com.jachwisunbae.promotion.support.PromotionProductsFixture.product;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.ProductCategory;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import com.jachwisunbae.promotion.provider.PromotionFetcher;
import com.jachwisunbae.promotion.repository.JdbcPromotionProductRepository;
import com.jachwisunbae.promotion.support.PromotionProductsFixture;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

@ExtendWith(OutputCaptureExtension.class)
class PromotionCollectionServiceTest {

    private static final ConvenienceBrand BRAND = ConvenienceBrand.EMART24;
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-27T04:00:00.123456Z"), ZoneOffset.UTC);
    private static final LocalDateTime COLLECTED_AT = LocalDateTime.of(2026, 10, 27, 13, 0, 0, 123456000);

    private final PromotionFetcher fetcher = mock(PromotionFetcher.class);
    private final JdbcPromotionProductRepository repository = mock(JdbcPromotionProductRepository.class);
    private final Clock clock = mock(Clock.class);
    private PromotionCollectionService service;

    @BeforeEach
    void setUp() {
        when(fetcher.brand()).thenReturn(BRAND);
        when(clock.instant()).thenReturn(CLOCK.instant());
        service = new PromotionCollectionService(List.of(fetcher), repository, clock);
    }

    @Test
    @DisplayName("모든 필드가 같은 항목만 제거하고 첫 수집 순서·같은 이름의 다른 행사·다른 가격을 유지한다")
    void deduplicatesExactProductsAndLogsCounts(final CapturedOutput output) {
        List<PromotionProduct> raw = PromotionProductsFixture.sample();
        List<PromotionProduct> expected = List.of(raw.get(0), raw.get(2), raw.get(3), raw.get(4), raw.get(5), raw.get(6));
        when(fetcher.fetch()).thenReturn(raw);
        when(repository.replaceByBrand(BRAND, expected, COLLECTED_AT)).thenReturn(4);

        service.collect(BRAND);

        verify(repository).replaceByBrand(BRAND, expected, COLLECTED_AT);
        assertThat(output).contains("rawCount=7 duplicateCount=1 uniqueCount=6",
                "success=true previousCount=4 storedCount=6", "collectedAt=2026-10-27T13:00:00.123456");
    }

    @Test
    @DisplayName("상품명·이미지·분류 중 하나라도 다르면 별도 항목으로 유지한다")
    void preservesDifferentFields() {
        PromotionProduct base = product("같은 이름");
        PromotionProduct image = new PromotionProduct(BRAND, base.name(), base.price(), "https://example.com/other.jpg",
                base.category(), base.promotionType());
        PromotionProduct category = new PromotionProduct(BRAND, base.name(), base.price(), base.imageUrl(),
                ProductCategory.SNACK, base.promotionType());
        PromotionProduct name = product("다른 이름");
        when(fetcher.fetch()).thenReturn(List.of(base, image, category, name, base));

        service.collect(BRAND);

        verify(repository).replaceByBrand(BRAND, List.of(base, image, category, name), COLLECTED_AT);
    }

    @Test
    @DisplayName("수집 실패 후 당일 재시도는 생략하고 다음 날 정상 수집을 허용한다")
    void doesNotStoreFailedCollectionAndReleasesGuard(final CapturedOutput output) {
        UpstreamServiceException failure = new UpstreamServiceException(ErrorCode.PROMOTION_PROVIDER_UNAVAILABLE,
                "전체 HTML은 로그에 남기지 않는다");
        when(fetcher.fetch()).thenThrow(failure).thenReturn(List.of(product("정상 상품")));

        assertThatThrownBy(() -> service.collect(BRAND)).isSameAs(failure);
        verifyNoInteractions(repository);
        assertThat(output).contains("success=false exceptionType=UpstreamServiceException")
                .doesNotContain("success=true", "전체 HTML은 로그에 남기지 않는다");

        service.collect(BRAND);
        verify(fetcher).fetch();
        when(clock.instant()).thenReturn(CLOCK.instant().plusSeconds(86400));
        service.collect(BRAND);

        verify(repository).replaceByBrand(BRAND, List.of(product("정상 상품")), COLLECTED_AT.plusDays(1));
    }

    @Test
    @DisplayName("빈 수집 결과는 기존 데이터 삭제를 요청하지 않는다")
    void rejectsEmptyCollection() {
        when(fetcher.fetch()).thenReturn(List.of());

        assertThatThrownBy(() -> service.collect(BRAND)).isInstanceOfSatisfying(UpstreamServiceException.class,
                exception -> assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.PROMOTION_RESPONSE_INVALID));
        verifyNoInteractions(repository);
    }

    @Test
    @DisplayName("이마트24 수집에 다른 브랜드가 섞이면 어느 브랜드도 교체하지 않는다")
    void rejectsUnexpectedBrand() {
        PromotionProduct base = product("상품");
        PromotionProduct otherBrand = new PromotionProduct(ConvenienceBrand.CU, base.name(), base.price(),
                base.imageUrl(), base.category(), base.promotionType());
        when(fetcher.fetch()).thenReturn(List.of(base, otherBrand));

        assertThatThrownBy(() -> service.collect(BRAND)).isInstanceOf(UpstreamServiceException.class);
        verifyNoInteractions(repository);
    }

    @Test
    @DisplayName("저장 실패는 성공 로그 없이 전파하고 이후 수집을 허용한다")
    void reportsStorageFailureAndReleasesGuard(final CapturedOutput output) {
        when(fetcher.fetch()).thenReturn(List.of(product("상품")));
        IllegalStateException failure = new IllegalStateException("storage failure");
        when(repository.replaceByBrand(eq(BRAND), any(), any())).thenThrow(failure).thenReturn(1);

        assertThatThrownBy(() -> service.collect(BRAND)).isSameAs(failure);
        assertThat(output).contains("success=false exceptionType=IllegalStateException").doesNotContain("success=true");

        service.collect(BRAND);
        verify(repository).replaceByBrand(BRAND, List.of(product("상품")), COLLECTED_AT);
        when(clock.instant()).thenReturn(CLOCK.instant().plusSeconds(86400));
        service.collect(BRAND);
        verify(repository).replaceByBrand(BRAND, List.of(product("상품")), COLLECTED_AT.plusDays(1));
    }

    @Test
    @DisplayName("같은 서비스에서 수집 중 재호출하면 추가 HTTP 수집·저장을 시작하지 않는다")
    void skipsOverlappingCollection(final CapturedOutput output) throws Exception {
        CountDownLatch entered = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        when(fetcher.fetch()).thenAnswer(invocation -> {
            entered.countDown();
            assertThat(release.await(5, TimeUnit.SECONDS)).isTrue();
            return List.of(product("상품"));
        });
        try (var executor = Executors.newSingleThreadExecutor()) {
            var running = executor.submit(() -> service.collect(BRAND));
            try {
                assertThat(entered.await(5, TimeUnit.SECONDS)).isTrue();
                service.collect(BRAND);
                verify(fetcher).fetch();
                verifyNoInteractions(repository);
                assertThat(output).contains("promotion-collection-skipped brand=EMART24 reason=already-running");
            } finally {
                release.countDown();
            }
            running.get(5, TimeUnit.SECONDS);
        }
        verify(repository).replaceByBrand(BRAND, List.of(product("상품")), COLLECTED_AT);
    }

    @Test
    void limitsEachBrandToOneAttemptPerKstDateEvenIfUtcDateIsSame(final CapturedOutput output) {
        when(fetcher.fetch()).thenReturn(List.of(product("상품")));
        when(clock.instant()).thenReturn(Instant.parse("2026-10-27T14:59:59Z"));
        service.collect(BRAND);
        service.collect(BRAND);
        verify(fetcher).fetch();
        assertThat(output).contains("reason=already-attempted-today");

        when(clock.instant()).thenReturn(Instant.parse("2026-10-27T15:00:00Z"));
        service.collect(BRAND);

        verify(fetcher, times(2)).fetch();
        verify(repository).replaceByBrand(BRAND, List.of(product("상품")), LocalDateTime.of(2026, 10, 28, 0, 0));
    }

    @Test
    void rejectsDuplicateOrUnregisteredBrand() {
        assertThatThrownBy(() -> new PromotionCollectionService(List.of(fetcher, fetcher), repository, clock))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.collect(ConvenienceBrand.GS25)).isInstanceOf(IllegalArgumentException.class);
    }
}
