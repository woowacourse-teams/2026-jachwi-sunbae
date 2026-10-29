package com.jachwisunbae.promotion.provider.seveneleven;

import static com.jachwisunbae.promotion.provider.seveneleven.SevenElevenPromotionFixtures.first;
import static com.jachwisunbae.promotion.provider.seveneleven.SevenElevenPromotionFixtures.more;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import com.jachwisunbae.promotion.domain.PromotionType;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

@ExtendWith(OutputCaptureExtension.class)
class SevenElevenPromotionFetcherTest {

    private static final SevenElevenPromotionTab FIRST_TAB = SevenElevenPromotionTab.ONE_PLUS_ONE;
    private static final SevenElevenPromotionTab SALE = SevenElevenPromotionTab.SALE;

    private final SevenElevenPromotionClient client = mock(SevenElevenPromotionClient.class);
    private final SevenElevenPromotionFetcher fetcher = new SevenElevenPromotionFetcher(client);

    @BeforeEach
    void setUp() {
        // 기본은 모든 탭이 첫 화면 13건으로 끝난다.
        for (SevenElevenPromotionTab tab : SevenElevenPromotionTab.values()) {
            when(client.fetchFirst(tab)).thenReturn(first(tab, 13));
        }
    }

    @Test
    @DisplayName("세 행사 탭의 첫 화면을 차례로 수집하고 원본 순서를 유지한다")
    void collectsAllTabs() {
        List<PromotionProduct> products = fetcher.fetch();

        assertThat(fetcher.brand()).isEqualTo(ConvenienceBrand.SEVEN_ELEVEN);
        assertThat(products).hasSize(39);
        assertThat(products.getFirst().name()).isEqualTo("빙그레)래핑카우8포션치즈120g");
        assertThat(products).filteredOn(product -> product.promotionType() == PromotionType.SALE).hasSize(13);
        InOrder order = inOrder(client);
        for (SevenElevenPromotionTab tab : SevenElevenPromotionTab.values()) {
            order.verify(client).fetchFirst(tab);
        }
        verify(client, never()).fetchMore(eq(FIRST_TAB), anyInt());
    }

    @Test
    @DisplayName("더보기를 2페이지부터 요청하고 마지막 페이지의 남은 수만큼 받으면 종료한다")
    void collectsMorePagesUntilTotal() {
        when(client.fetchFirst(FIRST_TAB)).thenReturn(first(FIRST_TAB, 25));
        when(client.fetchMore(FIRST_TAB, 2)).thenReturn(more(FIRST_TAB, 2, 10));
        when(client.fetchMore(FIRST_TAB, 3)).thenReturn(more(FIRST_TAB, 3, 2));

        List<PromotionProduct> products = fetcher.fetch();

        assertThat(products).hasSize(51);
        assertThat(products.get(13).name()).isEqualTo("남양)아몬드데이언스위트190ml");
        verify(client, never()).fetchMore(FIRST_TAB, 1);
        verify(client, never()).fetchMore(FIRST_TAB, 4);
    }

    @Test
    @DisplayName("실제 할인행사처럼 98% 이상 확보한 뒤 짧은 응답이 오면 부분 수집으로 인정하고 기록한다")
    void acceptsRealShortSaleResponse(final CapturedOutput output) {
        // 2026-10-29 실측: 전체 484건, 47페이지까지 473건, 48페이지 7건 → 480건(99.2%)
        when(client.fetchFirst(SALE)).thenReturn(first(SALE, 484));
        when(client.fetchMore(eq(SALE), anyInt())).thenAnswer(invocation -> more(SALE, invocation.getArgument(1), 10));
        when(client.fetchMore(SALE, 48)).thenReturn(SevenElevenPromotionFixtures.html("sale-short-before-total"));

        List<PromotionProduct> products = fetcher.fetch();

        assertThat(products).filteredOn(product -> product.promotionType() == PromotionType.SALE).hasSize(480);
        verify(client, never()).fetchMore(SALE, 49);
        assertThat(output).contains("promotion-seven-eleven-partial-collection", "tab=\"SALE\"", "page=\"48\"",
                "totalCount=\"484\"", "collectedCount=\"480\"", "missingCount=\"4\"");
    }

    @Test
    @DisplayName("짧은 응답까지의 확보율이 98% 미만이면 부분 결과를 반환하지 않는다")
    void rejectsLowCoverage(final CapturedOutput output) {
        // 첫 화면 13건 + 2~20페이지 190건 + 21페이지 1건 = 204건 / 213건(95.8%)
        when(client.fetchFirst(FIRST_TAB)).thenReturn(first(FIRST_TAB, 213));
        when(client.fetchMore(eq(FIRST_TAB), anyInt()))
                .thenAnswer(invocation -> more(FIRST_TAB, invocation.getArgument(1), 10));
        when(client.fetchMore(FIRST_TAB, 21)).thenReturn(more(FIRST_TAB, 21, 1));

        assertThatThrownBy(fetcher::fetch).isInstanceOfSatisfying(UpstreamServiceException.class, exception -> {
            assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.PROMOTION_RESPONSE_INVALID);
            assertThat(exception).hasMessageContaining("tab=ONE_PLUS_ONE", "page=21", "collectedCount=204");
        });
        verify(client, never()).fetchMore(FIRST_TAB, 22);
        verify(client, never()).fetchFirst(SevenElevenPromotionTab.TWO_PLUS_ONE);
        assertThat(output).doesNotContain("promotion-seven-eleven-partial-collection");
    }

    @Test
    @DisplayName("더보기 응답이 비어 있으면 부분 수집으로 인정하지 않는다")
    void rejectsEmptyMorePage() {
        when(client.fetchFirst(FIRST_TAB)).thenReturn(first(FIRST_TAB, 14));
        when(client.fetchMore(FIRST_TAB, 2)).thenReturn(more(FIRST_TAB, 2, 0));

        assertThatThrownBy(fetcher::fetch).isInstanceOfSatisfying(UpstreamServiceException.class,
                exception -> assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.PROMOTION_RESPONSE_INVALID));
    }

    @Test
    @DisplayName("중간 요청이 실패하면 재시도하거나 다음 탭을 수집하지 않고 실패를 전파한다")
    void stopsWhenRequestFails() {
        UpstreamServiceException failure = new UpstreamServiceException(ErrorCode.PROMOTION_PROVIDER_UNAVAILABLE,
                "HTTP status=429");
        when(client.fetchFirst(FIRST_TAB)).thenReturn(first(FIRST_TAB, 23));
        when(client.fetchMore(FIRST_TAB, 2)).thenThrow(failure);

        assertThatThrownBy(fetcher::fetch).isSameAs(failure);
        verify(client).fetchMore(FIRST_TAB, 2);
        verify(client, never()).fetchFirst(SevenElevenPromotionTab.TWO_PLUS_ONE);
    }

    @Test
    @DisplayName("최대 페이지에 도달해도 전체 수를 채우지 못하면 성공으로 처리하지 않는다")
    void failsAtPageLimit() {
        when(client.fetchFirst(FIRST_TAB)).thenReturn(first(FIRST_TAB, 40));
        when(client.fetchMore(FIRST_TAB, 2)).thenReturn(more(FIRST_TAB, 2, 10));

        assertThatThrownBy(() -> new SevenElevenPromotionFetcher(client, 2).fetch())
                .isInstanceOf(UpstreamServiceException.class).hasMessageContaining("최대 수집 페이지");
        verify(client, never()).fetchMore(FIRST_TAB, 3);
    }
}
