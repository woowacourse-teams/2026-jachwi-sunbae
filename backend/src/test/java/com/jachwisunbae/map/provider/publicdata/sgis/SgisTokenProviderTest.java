package com.jachwisunbae.map.provider.publicdata.sgis;

import static org.assertj.core.api.Assertions.assertThat;

import com.jachwisunbae.support.TestClock;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

class SgisTokenProviderTest {

    private static final Instant NOW = Instant.parse("2026-09-26T00:00:00Z");
    private static final Duration TOKEN_LIFETIME = Duration.ofHours(4);

    private final TestClock clock = new TestClock(NOW);
    private final FakeSgisAuthClient authClient = new FakeSgisAuthClient(clock);
    private final SgisTokenProvider tokenProvider = new SgisTokenProvider(authClient, clock);

    @Test
    @DisplayName("처음 요청하면 토큰을 발급받는다")
    void issuesTokenOnFirstRequest() {
        assertThat(tokenProvider.getToken()).isEqualTo("token-1");
        assertThat(authClient.issueCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("만료 전이면 발급받은 토큰을 다시 사용한다")
    void reusesTokenBeforeExpiry() {
        tokenProvider.getToken();
        clock.advance(Duration.ofHours(3));

        assertThat(tokenProvider.getToken()).isEqualTo("token-1");
        assertThat(authClient.issueCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("만료 5분 전부터는 토큰을 새로 발급받는다")
    void refreshesTokenNearExpiry() {
        tokenProvider.getToken();
        clock.advance(TOKEN_LIFETIME.minusMinutes(5));

        assertThat(tokenProvider.getToken()).isEqualTo("token-2");
        assertThat(authClient.issueCount()).isEqualTo(2);
    }

    private static class FakeSgisAuthClient extends SgisAuthClient {

        private final Clock clock;
        private int issueCount;

        FakeSgisAuthClient(Clock clock) {
            super((RestClient) null, "test-key", "test-secret");
            this.clock = clock;
        }

        int issueCount() {
            return issueCount;
        }

        @Override
        public SgisAccessToken issue() {
            issueCount++;
            return new SgisAccessToken("token-" + issueCount, clock.instant().plus(TOKEN_LIFETIME));
        }
    }
}
