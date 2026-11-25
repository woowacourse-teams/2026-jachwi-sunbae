package com.jachwisunbae.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

import com.jachwisunbae.auth.client.OAuthProviderClient;
import com.jachwisunbae.auth.domain.OAuthProvider;
import com.jachwisunbae.auth.repository.OAuthUnlinkRequestRepository;
import com.jachwisunbae.auth.scheduler.OAuthUnlinkScheduler;
import com.jachwisunbae.auth.support.FakeOAuthProvider;
import com.jachwisunbae.auth.token.OAuthTokenCipher;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest
@ActiveProfiles("test")
class OAuthUnlinkServiceIntegrationTest {

    @Container
    @ServiceConnection
    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4.10")
            .withCommand("--log-bin-trust-function-creators=1");
    private static final FakeOAuthProvider PROVIDER = FakeOAuthProvider.start();

    @Autowired
    private OAuthUnlinkService service;
    @Autowired
    private OAuthUnlinkRequestRepository requests;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private OAuthTokenCipher cipher;
    @MockitoSpyBean
    private OAuthProviderClient providers;
    @MockitoBean
    private Clock clock;

    private final AtomicReference<Instant> current = new AtomicReference<>();

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry registry) {
        registry.add("auth.oauth.kakao.admin-key", () -> FakeOAuthProvider.KAKAO_ADMIN_KEY);
        registry.add("auth.oauth.kakao.unlink-uri", PROVIDER::kakaoUnlinkUri);
        registry.add("auth.oauth.apple.client-id", () -> "kr.jachwisunbae.app");
        registry.add("auth.oauth.apple.team-id", () -> FakeOAuthProvider.APPLE_TEAM_ID);
        registry.add("auth.oauth.apple.key-id", () -> FakeOAuthProvider.APPLE_KEY_ID);
        registry.add("auth.oauth.apple.private-key", PROVIDER::applePrivateKey);
        registry.add("auth.oauth.apple.unlink-uri", PROVIDER::appleRevokeUri);
        registry.add("auth.oauth.token-encryption-key", () -> FakeOAuthProvider.TOKEN_ENCRYPTION_KEY);
    }

    @BeforeEach
    void setUp() {
        PROVIDER.reset();
        jdbc.update("DELETE FROM oauth_unlink_requests");
        current.set(Instant.now().truncatedTo(ChronoUnit.MICROS));
        when(clock.instant()).thenAnswer(invocation -> current.get());
        when(clock.getZone()).thenReturn(ZoneOffset.UTC);
    }

    @AfterEach
    void removeFailureTrigger() {
        jdbc.execute("DROP TRIGGER IF EXISTS fail_unlink_delete");
        jdbc.execute("DROP TRIGGER IF EXISTS fail_unlink_reschedule");
    }

    @AfterAll
    static void closeProvider() {
        PROVIDER.close();
    }

    @Test
    @DisplayName("같은 요청을 두 작업자가 동시에 처리해도 선점 기간에는 한 번만 제공자를 호출한다")
    void claimsExclusively() throws Exception {
        // given
        insertRequest(1, OAuthProvider.KAKAO, 0);
        CountDownLatch entered = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        doAnswer(invocation -> {
            entered.countDown();
            await(release);
            return null;
        }).when(providers).unlink(any(), anyString(), any(), any());

        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(service::processDue);
            try {
                await(entered);

                // when & then
                assertThat(executor.submit(restartedService()::processDue).get(10, TimeUnit.SECONDS)).isZero();
                assertThat(count()).isOne();
            } finally {
                release.countDown();
            }
            assertThat(first.get(10, TimeUnit.SECONDS)).isOne();
            assertThat(count()).isZero();
        }
    }

    @Test
    @DisplayName("선점 직후 작업자가 종료돼도 새 처리기는 5분 만료 시점부터 요청을 재처리한다")
    void resumesExpiredClaimAfterRestart() {
        // given
        insertRequest(1, OAuthProvider.APPLE, 0);
        requests.claim(1L, now(), now().plusMinutes(5));
        OAuthUnlinkService restarted = restartedService();
        current.updateAndGet(value -> value.plus(Duration.ofMinutes(5)).minusMillis(1));
        assertThat(restarted.processDue()).isZero();

        // when
        current.updateAndGet(value -> value.plusMillis(1));

        // then
        new OAuthUnlinkScheduler(restarted).unlink();
        assertThat(PROVIDER.revocations()).hasSize(1);
        assertThat(count()).isZero();
    }

    @Test
    @DisplayName("재예약 SQL까지 실패해도 선점과 자격정보를 보존하고 다음 스케줄러 실행에서 재처리한다")
    void recoversWhenReschedulingFails() {
        // given
        insertRequest(1, OAuthProvider.APPLE, 0);
        PROVIDER.respondToRevoke(503, "");
        var before = jdbc.queryForMap("SELECT provider_subject, provider_refresh_token FROM oauth_unlink_requests");
        jdbc.execute("""
                CREATE TRIGGER fail_unlink_reschedule BEFORE UPDATE ON oauth_unlink_requests
                FOR EACH ROW
                BEGIN
                    IF NEW.attempts <> OLD.attempts THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'injected reschedule failure';
                    END IF;
                END
                """);

        // when
        new OAuthUnlinkScheduler(service).unlink();

        // then
        assertThat(jdbc.queryForMap("SELECT provider_subject, provider_refresh_token FROM oauth_unlink_requests"))
                .isEqualTo(before);
        assertThat(jdbc.queryForObject("SELECT attempts FROM oauth_unlink_requests", Integer.class)).isZero();
        assertThat(nextAttemptAt()).isEqualTo(now().plusMinutes(5));
        jdbc.execute("DROP TRIGGER fail_unlink_reschedule");
        PROVIDER.respondToRevoke(200, "");
        current.updateAndGet(value -> value.plus(Duration.ofMinutes(5)));
        new OAuthUnlinkScheduler(restartedService()).unlink();
        assertThat(PROVIDER.revocations()).hasSize(2);
        assertThat(count()).isZero();
    }

    @ParameterizedTest
    @EnumSource(OAuthProvider.class)
    @DisplayName("제공자 성공 후 DB 삭제가 실패하면 요청을 보존하고 이미 해제된 계정도 다시 처리해 지운다")
    void retriesAfterProviderSuccessAndDatabaseDeleteFailure(OAuthProvider provider) {
        // given
        insertRequest(1, provider, 0);
        jdbc.execute("""
                CREATE TRIGGER fail_unlink_delete BEFORE DELETE ON oauth_unlink_requests
                FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'injected unlink delete failure'
                """);

        // when
        assertThat(service.processDue()).isOne();

        // then
        assertThat(count()).isOne();
        assertThat(jdbc.queryForObject("SELECT attempts FROM oauth_unlink_requests", Integer.class)).isOne();
        jdbc.execute("DROP TRIGGER fail_unlink_delete");
        PROVIDER.respondToUnlink(400, "{\"code\":-101,\"msg\":\"not registered user\"}");
        PROVIDER.respondToRevoke(400, "{\"error\":\"invalid_grant\"}");
        current.updateAndGet(value -> value.plus(Duration.ofMinutes(1)));
        assertThat(restartedService().processDue()).isOne();
        assertThat(provider == OAuthProvider.KAKAO ? PROVIDER.unlinks() : PROVIDER.revocations()).hasSize(2);
        assertThat(count()).isZero();
    }

    @ParameterizedTest
    @EnumSource(OldWorkerResult.class)
    @DisplayName("선점 만료 후 이전 작업자의 성공·실패·마지막 실패가 새 작업자의 요청을 삭제하거나 덮어쓰지 않는다")
    void fencesExpiredWorker(OldWorkerResult result) throws Exception {
        // given
        int attempts = result == OldWorkerResult.LAST_FAILURE ? 11 : 0;
        insertRequest(1, OAuthProvider.KAKAO, attempts);
        CountDownLatch oldEntered = new CountDownLatch(1);
        CountDownLatch newEntered = new CountDownLatch(1);
        CountDownLatch releaseOld = new CountDownLatch(1);
        CountDownLatch releaseNew = new CountDownLatch(1);
        AtomicInteger calls = new AtomicInteger();
        doAnswer(invocation -> {
            if (calls.incrementAndGet() == 1) {
                oldEntered.countDown();
                await(releaseOld);
                if (result != OldWorkerResult.SUCCESS) {
                    throw new IllegalStateException("injected old worker failure");
                }
            } else {
                newEntered.countDown();
                await(releaseNew);
            }
            return null;
        }).when(providers).unlink(any(), anyString(), any(), any());

        try (var executor = Executors.newFixedThreadPool(2)) {
            var oldWorker = executor.submit(service::processDue);
            try {
                await(oldEntered);
                current.updateAndGet(value -> value.plus(Duration.ofMinutes(5)));
                var newWorker = executor.submit(restartedService()::processDue);
                await(newEntered);
                LocalDateTime newLease = nextAttemptAt();

                // when
                releaseOld.countDown();
                assertThat(oldWorker.get(10, TimeUnit.SECONDS)).isOne();

                // then
                assertThat(count()).as("새 작업자가 선점한 요청은 남아 있어야 한다").isOne();
                assertThat(nextAttemptAt()).isEqualTo(newLease);
                assertThat(jdbc.queryForObject("SELECT attempts FROM oauth_unlink_requests", Integer.class))
                        .isEqualTo(attempts);
                releaseNew.countDown();
                assertThat(newWorker.get(10, TimeUnit.SECONDS)).isOne();
                assertThat(count()).isZero();
            } finally {
                releaseOld.countDown();
                releaseNew.countDown();
            }
        }
    }

    @Test
    @DisplayName("앞 요청 처리가 오래 걸려도 다음 요청은 실제 선점 시각부터 5분 동안 보호된다")
    void leasesEachRequestFromCurrentTime() {
        // given
        insertRequest(1, OAuthProvider.KAKAO, 0);
        insertRequest(2, OAuthProvider.KAKAO, 0);
        AtomicReference<LocalDateTime> secondLease = new AtomicReference<>();
        doAnswer(invocation -> {
            if ("subject-1".equals(invocation.getArgument(1))) {
                current.updateAndGet(value -> value.plus(Duration.ofMinutes(6)));
            } else {
                secondLease.set(nextAttemptAt());
            }
            return null;
        }).when(providers).unlink(any(), anyString(), any(), any());

        // when
        assertThat(service.processDue()).isEqualTo(2);

        // then
        assertThat(secondLease.get()).isEqualTo(now().plusMinutes(5));
    }

    private void insertRequest(long id, OAuthProvider provider, int attempts) {
        jdbc.update("""
                INSERT INTO oauth_unlink_requests
                    (id, provider, provider_subject, provider_client_id, provider_refresh_token,
                     attempts, next_attempt_at, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, id, provider.name(), "subject-" + id, "kr.jachwisunbae.app",
                provider == OAuthProvider.APPLE ? cipher.encrypt("refresh-token") : null, attempts, now(), now());
    }

    private OAuthUnlinkService restartedService() {
        return new OAuthUnlinkService(new OAuthUnlinkRequestRepository(jdbc), providers, cipher, clock);
    }

    private int count() {
        return jdbc.queryForObject("SELECT COUNT(*) FROM oauth_unlink_requests", Integer.class);
    }

    private LocalDateTime nextAttemptAt() {
        return jdbc.queryForObject("SELECT next_attempt_at FROM oauth_unlink_requests", LocalDateTime.class);
    }

    private LocalDateTime now() {
        return LocalDateTime.now(clock);
    }

    private static void await(CountDownLatch latch) throws InterruptedException {
        assertThat(latch.await(10, TimeUnit.SECONDS)).as("작업자 동기화 제한 시간").isTrue();
    }

    private enum OldWorkerResult {
        SUCCESS, FAILURE, LAST_FAILURE
    }
}
