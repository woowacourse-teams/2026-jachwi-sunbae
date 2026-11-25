package com.jachwisunbae.auth.repository;

import com.jachwisunbae.auth.domain.OAuthProvider;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

// 탈퇴한 회원의 제공자 연결 해제 요청. 토큰은 암호문 그대로 읽고 처리하는 쪽이 복호화한다.
@Repository
public class OAuthUnlinkRequestRepository {

    private final JdbcTemplate jdbc;

    public OAuthUnlinkRequestRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Long> findDueIds(LocalDateTime now, int limit) {
        return jdbc.queryForList("""
                SELECT id FROM oauth_unlink_requests
                WHERE next_attempt_at <= ?
                ORDER BY next_attempt_at, id
                LIMIT ?
                """, Long.class, now, limit);
    }

    // 여러 서버가 같은 요청을 동시에 처리하지 않도록 다음 시도 시각을 뒤로 미뤄 선점한다.
    // 처리 중 서버가 멈추면 선점이 끝난 뒤 다른 서버가 이어서 처리한다.
    public Optional<UnlinkRequest> claim(Long id, LocalDateTime now, LocalDateTime leaseUntil) {
        String claimToken = UUID.randomUUID().toString();
        int updated = jdbc.update("""
                UPDATE oauth_unlink_requests SET next_attempt_at = ?, claim_token = ?
                WHERE id = ? AND next_attempt_at <= ?
                """, leaseUntil, claimToken, id, now);
        if (updated == 0) {
            return Optional.empty();
        }
        return jdbc.query("""
                SELECT id, provider, provider_subject, provider_client_id, provider_refresh_token, attempts, claim_token
                FROM oauth_unlink_requests WHERE id = ? AND claim_token = ?
                """, (rs, row) -> new UnlinkRequest(rs.getLong("id"), OAuthProvider.valueOf(rs.getString("provider")),
                rs.getString("provider_subject"), rs.getString("provider_client_id"),
                rs.getString("provider_refresh_token"), rs.getInt("attempts"), rs.getString("claim_token")),
                id, claimToken).stream().findFirst();
    }

    // 만료 후 새 작업자가 선점했다면 이전 작업자의 결과로 행을 지우거나 재예약하지 않는다.
    public boolean delete(UnlinkRequest request) {
        return jdbc.update("DELETE FROM oauth_unlink_requests WHERE id = ? AND claim_token = ?",
                request.id(), request.claimToken()) == 1;
    }

    public boolean reschedule(UnlinkRequest request, int attempts, LocalDateTime nextAttemptAt) {
        return jdbc.update("""
                UPDATE oauth_unlink_requests SET attempts = ?, next_attempt_at = ?, claim_token = NULL
                WHERE id = ? AND claim_token = ?
                """, attempts, nextAttemptAt, request.id(), request.claimToken()) == 1;
    }

    public record UnlinkRequest(Long id, OAuthProvider provider, String subject, String clientId,
                                String encryptedRefreshToken, int attempts, String claimToken) {
    }
}
