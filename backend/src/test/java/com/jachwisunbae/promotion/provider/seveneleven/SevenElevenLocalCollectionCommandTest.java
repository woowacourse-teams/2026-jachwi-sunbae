package com.jachwisunbae.promotion.provider.seveneleven;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.jsoup.Jsoup;

class SevenElevenLocalCollectionCommandTest {

    @TempDir
    Path directory;

    @Test
    void fixtureIsClearlyPartialAndContainsOneExplicitDuplicate() {
        var products = SevenElevenLocalCollectionCommand.fetcher(new String[]{"--fixture"}).fetch();
        assertThat(products).hasSize(40);
        assertThat(products.stream().distinct()).hasSize(39);
    }

    @Test
    void rejectsIncompleteReplayAndExternalDatabaseOptionsBeforeDockerOrHttp() {
        assertThatThrownBy(() -> SevenElevenLocalCollectionCommand.fetcher(new String[]{"--replay", directory.toString()}))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("부분 수집");
        assertThatThrownBy(() -> SevenElevenLocalCollectionCommand.fetcher(new String[]{}))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> SevenElevenLocalCollectionCommand.fetcher(new String[]{"--fixture", "--spring.profiles.active=prod"}))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void replaysCompletedFixtureThroughActualFetcherWithoutNetwork() throws Exception {
        for (SevenElevenPromotionTab tab : SevenElevenPromotionTab.values()) {
            String first = SevenElevenPromotionFixtures.html("tab" + tab.code() + "-first")
                    .replaceAll("var intTotalCount = \"[0-9]+\";",
                            "var intTotalCount = \"" + (tab == SevenElevenPromotionTab.GIFT ? 0 : 13) + "\";");
            Files.writeString(directory.resolve("tab" + tab.code() + "-first.html"), first);
        }
        Files.writeString(directory.resolve("completed.txt"), "synthetic page-count fixture, not real full collection");

        assertThat(SevenElevenLocalCollectionCommand.fetcher(new String[]{"--replay", directory.toString()}).fetch())
                .hasSize(39);
    }

    @Test
    void dailyFileClaimSurvivesAnotherCommandAndUsesKstDate() {
        Clock beforeMidnight = Clock.fixed(Instant.parse("2026-10-27T14:59:59Z"), ZoneOffset.UTC);
        SevenElevenLocalCollectionCommand.claimDailyAttempt(directory, beforeMidnight);
        assertThatThrownBy(() -> SevenElevenLocalCollectionCommand.claimDailyAttempt(directory, beforeMidnight))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("day=2026-10-27");

        SevenElevenLocalCollectionCommand.claimDailyAttempt(directory,
                Clock.fixed(Instant.parse("2026-10-27T15:00:00Z"), ZoneOffset.UTC));

        assertThat(directory.resolve("seven-eleven-2026-10-27.attempt")).exists();
        assertThat(directory.resolve("seven-eleven-2026-10-28.attempt")).exists();
    }

    @Test
    void partialReplayAcceptsExactly98PercentIncludingShortPageWithoutCompletionMarker() throws Exception {
        preparePartial(100);

        var products = SevenElevenLocalCollectionCommand.fetcher(new String[]{"--replay-partial", directory.toString()}).fetch();

        assertThat(products).hasSize(124); // 1+1 13 + 2+1 13 + 할인 98
        assertThat(directory.resolve("completed.txt")).doesNotExist();
        assertThatThrownBy(() -> SevenElevenLocalCollectionCommand.fetcher(new String[]{"--replay", directory.toString()}))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void partialReplayRejectsTabBelow98Percent() throws Exception {
        preparePartial(101);

        assertThatThrownBy(() -> SevenElevenLocalCollectionCommand
                .fetcher(new String[]{"--replay-partial", directory.toString()}).fetch())
                .hasMessageContaining("98% 미만").hasMessageContaining("SALE");
    }

    @ParameterizedTest
    @ValueSource(strings = {"blank", "empty-products", "missing-field"})
    void partialReplayStillRejectsInvalidResponsesEvenWhenNear98Percent(final String failure) throws Exception {
        preparePartial(100);
        if (failure.equals("missing-field")) {
            var doc = Jsoup.parse(Files.readString(directory.resolve("tab4-page10.html")));
            doc.selectFirst(".name").text("");
            Files.writeString(directory.resolve("tab4-page10.html"), doc.body().html());
        } else {
            Files.writeString(directory.resolve("tab4-page11.html"), failure.equals("blank") ? ""
                    : "<input id='listCnt' value='98'><input id='listPage' value='12'>");
        }

        assertThatThrownBy(() -> SevenElevenLocalCollectionCommand
                .fetcher(new String[]{"--replay-partial", directory.toString()}).fetch())
                .isInstanceOf(com.jachwisunbae.common.exception.server.UpstreamServiceException.class);
    }

    private void preparePartial(final int saleTotal) throws Exception {
        for (SevenElevenPromotionTab tab : SevenElevenPromotionTab.values()) {
            int total = tab == SevenElevenPromotionTab.SALE ? saleTotal : tab == SevenElevenPromotionTab.GIFT ? 0 : 13;
            Files.writeString(directory.resolve("tab" + tab.code() + "-first.html"),
                    SevenElevenPromotionFixtures.html("tab" + tab.code() + "-first")
                            .replaceAll("var intTotalCount = \"[0-9]+\";", "var intTotalCount = \"" + total + "\";"));
        }
        for (int page = 2; page <= 10; page++) {
            String html = page == 10 ? SevenElevenPromotionFixtures.html("sale-short-before-total")
                    : SevenElevenPromotionFixtures.html("tab1-page2").replace("1+1", "할인");
            var doc = Jsoup.parse(html);
            var cards = doc.body().children().stream()
                    .filter(element -> element.tagName().equals("li") && !element.hasClass("btn_more")).toList();
            if (page == 10) {
                cards.subList(5, cards.size()).forEach(org.jsoup.nodes.Element::remove);
            }
            doc.selectFirst("#listPage").val(String.valueOf(page + 1));
            Files.writeString(directory.resolve("tab4-page" + page + ".html"), doc.body().html());
        }
    }
}
