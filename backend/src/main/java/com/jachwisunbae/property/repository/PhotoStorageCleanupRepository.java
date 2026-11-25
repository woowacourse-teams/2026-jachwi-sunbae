package com.jachwisunbae.property.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PhotoStorageCleanupRepository {

    private final JdbcTemplate jdbc;

    public PhotoStorageCleanupRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void save(String key, String thumbnailKey, LocalDateTime now, LocalDateTime retryAt) {
        jdbc.update("""
                INSERT INTO photo_storage_cleanup_requests
                    (storage_key, thumbnail_storage_key, attempts, next_attempt_at, created_at)
                VALUES (?, ?, 0, ?, ?)
                ON DUPLICATE KEY UPDATE next_attempt_at = ?
                """, key, thumbnailKey, retryAt, now, retryAt);
    }

    public List<String> findDueKeys(LocalDateTime now, int limit) {
        return jdbc.queryForList("""
                SELECT storage_key FROM photo_storage_cleanup_requests
                WHERE next_attempt_at <= ? ORDER BY next_attempt_at, id LIMIT ?
                """, String.class, now, limit);
    }

    public Optional<CleanupRequest> lock(String key) {
        return jdbc.query("""
                SELECT id, storage_key, thumbnail_storage_key, attempts
                FROM photo_storage_cleanup_requests WHERE storage_key = ? FOR UPDATE SKIP LOCKED
                """, (rs, row) -> new CleanupRequest(rs.getLong("id"), rs.getString("storage_key"),
                rs.getString("thumbnail_storage_key"), rs.getInt("attempts")), key).stream().findFirst();
    }

    // 논리 삭제한 사진도 보관 대상이므로 deleted_at으로 제외하지 않는다.
    public boolean isReferenced(String key) {
        return Boolean.TRUE.equals(jdbc.queryForObject("""
                SELECT EXISTS(SELECT 1 FROM property_photos WHERE storage_key = ? OR thumbnail_storage_key = ?)
                """, Boolean.class, key, key));
    }

    public void delete(String key) {
        jdbc.update("DELETE FROM photo_storage_cleanup_requests WHERE storage_key = ?", key);
    }

    public void reschedule(long id, int attempts, LocalDateTime next) {
        jdbc.update("UPDATE photo_storage_cleanup_requests SET attempts = ?, next_attempt_at = ? WHERE id = ?",
                attempts, next, id);
    }

    public List<Long> findExpiredPhotoIds(LocalDateTime now, int limit) {
        return jdbc.queryForList("""
                SELECT ph.id FROM property_photos ph
                JOIN properties p ON p.id = ph.property_id
                JOIN members m ON m.id = p.member_id
                WHERE ph.storage_purged_at IS NULL
                  AND (p.deleted_at <= ? OR m.deleted_at <= ?)
                  AND (ph.storage_purge_next_attempt_at IS NULL OR ph.storage_purge_next_attempt_at <= ?)
                ORDER BY ph.id LIMIT ?
                """, Long.class, now.minusDays(90), now.minusDays(90), now, limit);
    }

    public Optional<RetainedPhoto> lockExpiredPhoto(long photoId, LocalDateTime now) {
        return jdbc.query("""
                SELECT ph.id, ph.storage_key, ph.thumbnail_storage_key FROM property_photos ph
                JOIN properties p ON p.id = ph.property_id
                JOIN members m ON m.id = p.member_id
                WHERE ph.id = ? AND ph.storage_purged_at IS NULL
                  AND (p.deleted_at <= ? OR m.deleted_at <= ?)
                  AND (ph.storage_purge_next_attempt_at IS NULL OR ph.storage_purge_next_attempt_at <= ?)
                FOR UPDATE SKIP LOCKED
                """, (rs, row) -> new RetainedPhoto(rs.getLong("id"), rs.getString("storage_key"),
                rs.getString("thumbnail_storage_key")), photoId, now.minusDays(90), now.minusDays(90), now)
                .stream().findFirst();
    }

    public void markPurged(long photoId, LocalDateTime now) {
        jdbc.update("UPDATE property_photos SET storage_purged_at = ?, storage_purge_next_attempt_at = NULL WHERE id = ?",
                now, photoId);
    }

    public void retryPurge(long photoId, LocalDateTime next) {
        jdbc.update("UPDATE property_photos SET storage_purge_next_attempt_at = ? WHERE id = ?", next, photoId);
    }

    public record CleanupRequest(long id, String storageKey, String thumbnailKey, int attempts) {
    }

    public record RetainedPhoto(long id, String storageKey, String thumbnailKey) {
    }
}
