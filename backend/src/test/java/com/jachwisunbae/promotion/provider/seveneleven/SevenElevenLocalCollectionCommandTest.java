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
}
