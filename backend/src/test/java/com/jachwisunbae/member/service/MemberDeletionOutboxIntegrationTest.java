package com.jachwisunbae.member.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jachwisunbae.auth.token.OAuthTokenCipher;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest(properties = "auth.oauth.token-encryption-key=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
@ActiveProfiles("test")
class MemberDeletionOutboxIntegrationTest {

    @Container
    @ServiceConnection
    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4.10")
            .withCommand("--log-bin-trust-function-creators=1");

    private static final List<String> TABLES = List.of(
            "members", "properties", "property_photos", "refresh_tokens", "member_identities", "oauth_unlink_requests");

    @Autowired
    private MemberService service;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private OAuthTokenCipher cipher;

    private String encryptedToken;

    @BeforeEach
    void setUp() {
        jdbc.update("DELETE FROM oauth_unlink_requests");
        jdbc.update("DELETE FROM member_identities");
        jdbc.update("DELETE FROM refresh_tokens");
        jdbc.update("DELETE FROM property_photos");
        jdbc.update("DELETE FROM properties");
        jdbc.update("DELETE FROM members");
        jdbc.update("INSERT INTO members (id, created_at, updated_at) VALUES (1, NOW(6), NOW(6))");
        jdbc.update("INSERT INTO properties (id, member_id, name, created_at) VALUES (1, 1, '원룸', NOW(6))");
        jdbc.update("""
                INSERT INTO property_photos (property_id, member_id, storage_key, content_type, size_bytes, created_at)
                VALUES (1, 1, 'photos/test.jpg', 'image/jpeg', 10, NOW(6))
                """);
        jdbc.update("""
                INSERT INTO refresh_tokens (member_id, token_hash, created_at, updated_at, expires_at)
                VALUES (1, ?, NOW(6), NOW(6), NOW(6) + INTERVAL 1 DAY)
                """, "a".repeat(64));
        encryptedToken = cipher.encrypt("apple-refresh-token");
        jdbc.update("""
                INSERT INTO member_identities
                    (member_id, provider, provider_subject, provider_client_id, provider_refresh_token, created_at)
                VALUES (1, 'APPLE', 'apple-user', 'kr.jachwisunbae.app', ?, NOW(6))
                """, encryptedToken);
    }

    @AfterEach
    void removeFailureTrigger() {
        jdbc.execute("DROP TRIGGER IF EXISTS fail_member_deletion");
    }

    @Test
    @DisplayName("탈퇴가 커밋되면 회원·기록 삭제와 세션·연결 제거 및 암호화된 Outbox 저장이 함께 반영된다")
    void commitsDeletionAndOutboxTogether() {
        // when
        service.delete(1L);

        // then
        for (String table : List.of("members", "properties", "property_photos")) {
            assertThat(jdbc.queryForObject("SELECT deleted_at IS NOT NULL FROM " + table, Boolean.class)).isTrue();
        }
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM refresh_tokens", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM member_identities", Integer.class)).isZero();
        assertThat(jdbc.queryForList("""
                SELECT provider, provider_subject, provider_client_id, provider_refresh_token, attempts
                FROM oauth_unlink_requests
                """)).containsExactly(Map.of("provider", "APPLE", "provider_subject", "apple-user",
                "provider_client_id", "kr.jachwisunbae.app", "provider_refresh_token", encryptedToken, "attempts", 0));
        assertThat(cipher.decrypt(encryptedToken)).isEqualTo("apple-refresh-token");
    }

    @ParameterizedTest
    @ValueSource(strings = {"INSERT ON oauth_unlink_requests", "DELETE ON member_identities", "UPDATE ON members"})
    @DisplayName("Outbox 저장·연결 제거·회원 삭제 중 DB 실패가 나면 세션과 소유 기록까지 모두 롤백된다")
    void rollsBackEveryChangeWhenDeletionFails(String failurePoint) {
        // given
        List<List<Map<String, Object>>> before = snapshot();
        jdbc.execute("CREATE TRIGGER fail_member_deletion BEFORE " + failurePoint
                + " FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'injected member deletion failure'");

        // when & then
        assertThatThrownBy(() -> service.delete(1L)).isInstanceOf(DataAccessException.class)
                .hasMessageContaining("injected member deletion failure");
        assertThat(snapshot()).isEqualTo(before);
    }

    private List<List<Map<String, Object>>> snapshot() {
        return TABLES.stream().map(table -> jdbc.queryForList("SELECT * FROM " + table + " ORDER BY id")).toList();
    }
}
