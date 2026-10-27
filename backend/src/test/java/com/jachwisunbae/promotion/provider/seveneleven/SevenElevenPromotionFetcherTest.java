package com.jachwisunbae.promotion.provider.seveneleven;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import org.jsoup.Jsoup;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SevenElevenPromotionFetcherTest {

    private final SevenElevenPromotionClient client = mock(SevenElevenPromotionClient.class);
    private final SevenElevenPromotionFetcher fetcher = new SevenElevenPromotionFetcher(client);

    @BeforeEach
    void setUp() {
        for (SevenElevenPromotionTab tab : SevenElevenPromotionTab.values()) {
            when(client.fetchFirst(tab)).thenReturn(first(tab, tab == SevenElevenPromotionTab.GIFT ? 0 : 13));
        }
    }

    @Test
    void combinesAllTabsAndKeepsOriginalOrder() {
        assertThat(fetcher.brand()).isEqualTo(ConvenienceBrand.SEVEN_ELEVEN);
        var products = fetcher.fetch();
        assertThat(products).hasSize(39);
        assertThat(products.getFirst().name()).isEqualTo("빙그레)래핑카우8포션치즈120g");
        for (SevenElevenPromotionTab tab : SevenElevenPromotionTab.values()) {
            verify(client).fetchFirst(tab);
            verify(client, never()).fetchMore(eq(tab), anyInt());
        }
    }

    @Test
    void startsMoreFromPageTwoRatherThanLosingFirstThreeProducts() {
        when(client.fetchFirst(SevenElevenPromotionTab.ONE_PLUS_ONE)).thenReturn(first(SevenElevenPromotionTab.ONE_PLUS_ONE, 23));
        when(client.fetchMore(SevenElevenPromotionTab.ONE_PLUS_ONE, 2)).thenReturn(more(2, 10));

        var products = fetcher.fetch();

        assertThat(products).hasSize(49);
        assertThat(products.get(13).name()).isEqualTo("남양)아몬드데이언스위트190ml");
        verify(client, never()).fetchMore(SevenElevenPromotionTab.ONE_PLUS_ONE, 1);
        verify(client, never()).fetchMore(SevenElevenPromotionTab.ONE_PLUS_ONE, 3);
    }

    @Test
    void acceptsExactlyRemainingCardsOnLastPage() {
        when(client.fetchFirst(SevenElevenPromotionTab.ONE_PLUS_ONE)).thenReturn(first(SevenElevenPromotionTab.ONE_PLUS_ONE, 15));
        when(client.fetchMore(SevenElevenPromotionTab.ONE_PLUS_ONE, 2)).thenReturn(more(2, 2));

        assertThat(fetcher.fetch()).hasSize(41);
        verify(client, never()).fetchMore(SevenElevenPromotionTab.ONE_PLUS_ONE, 3);
    }

    @Test
    void failsOnMissingOrCumulativeFragmentRatherThanReturningPartialList() {
        when(client.fetchFirst(SevenElevenPromotionTab.ONE_PLUS_ONE)).thenReturn(first(SevenElevenPromotionTab.ONE_PLUS_ONE, 23));
        when(client.fetchMore(SevenElevenPromotionTab.ONE_PLUS_ONE, 2)).thenReturn(more(2, 9));
        assertThatThrownBy(fetcher::fetch).isInstanceOf(UpstreamServiceException.class);
        verify(client, never()).fetchFirst(SevenElevenPromotionTab.TWO_PLUS_ONE);
    }

    @Test
    void propagatesRequestFailureAndDoesNotRetry() {
        IllegalStateException failure = new IllegalStateException("timeout");
        when(client.fetchFirst(SevenElevenPromotionTab.ONE_PLUS_ONE)).thenReturn(first(SevenElevenPromotionTab.ONE_PLUS_ONE, 23));
        when(client.fetchMore(SevenElevenPromotionTab.ONE_PLUS_ONE, 2)).thenThrow(failure);
        assertThatThrownBy(fetcher::fetch).isSameAs(failure);
        verify(client).fetchMore(SevenElevenPromotionTab.ONE_PLUS_ONE, 2);
    }

    @Test
    void capsPagesInsteadOfTreatingGuardAsSuccessfulEnd() {
        when(client.fetchFirst(SevenElevenPromotionTab.ONE_PLUS_ONE)).thenReturn(first(SevenElevenPromotionTab.ONE_PLUS_ONE, 2510));
        when(client.fetchMore(eq(SevenElevenPromotionTab.ONE_PLUS_ONE), anyInt()))
                .thenAnswer(invocation -> more(invocation.getArgument(1), 10));
        assertThatThrownBy(fetcher::fetch).isInstanceOf(UpstreamServiceException.class).hasMessageContaining("최대 페이지");
        verify(client, never()).fetchMore(SevenElevenPromotionTab.ONE_PLUS_ONE, 251);
    }

    private String first(final SevenElevenPromotionTab tab, final int total) {
        return SevenElevenPromotionFixtures.html("tab" + tab.code() + "-first")
                .replaceAll("var intTotalCount = \"[0-9]+\";", "var intTotalCount = \"" + total + "\";");
    }

    private String more(final int page, final int count) {
        var document = Jsoup.parse(SevenElevenPromotionFixtures.html("tab1-page2"));
        var cards = document.body().children().stream()
                .filter(element -> element.tagName().equals("li") && !element.hasClass("btn_more")).toList();
        cards.subList(count, cards.size()).forEach(org.jsoup.nodes.Element::remove);
        document.selectFirst("#listPage").val(String.valueOf(page + 1));
        return document.body().html();
    }
}
