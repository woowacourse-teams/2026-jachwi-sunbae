package com.jachwisunbae.admin.repository;

import com.jachwisunbae.admin.repository.query.AdminMember;
import com.jachwisunbae.admin.repository.query.AdminSummary;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcAdminQueryRepository {

    private final JdbcTemplate jdbc;

    public JdbcAdminQueryRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public AdminSummary summary(LocalDateTime startUtc, LocalDateTime endUtc) {
        return jdbc.queryForObject("""
                SELECT COUNT(*) AS accounts,
                       COALESCE(SUM(m.created_at >= ? AND m.created_at < ?), 0) AS today,
                       (SELECT COUNT(*) FROM properties p JOIN members owner ON owner.id = p.member_id
                        WHERE p.deleted_at IS NULL AND owner.deleted_at IS NULL
                          AND owner.merged_into_member_id IS NULL) AS properties
                FROM members m
                WHERE m.deleted_at IS NULL AND m.merged_into_member_id IS NULL
                """, (rs, row) -> new AdminSummary(rs.getLong("accounts"), rs.getLong("today"),
                rs.getLong("properties")), startUtc, endUtc);
    }

    public List<AdminMember> recentMembers() {
        // 최근 20명의 매물·사진을 따로 집계해 조인으로 개수가 부풀지 않게 한다.
        return jdbc.query("""
                WITH recent_members AS (
                    SELECT id, created_at FROM members
                    WHERE deleted_at IS NULL AND merged_into_member_id IS NULL
                    ORDER BY created_at DESC, id DESC LIMIT 20
                ), property_counts AS (
                    SELECT p.member_id, COUNT(*) AS count
                    FROM properties p JOIN recent_members m ON m.id = p.member_id
                    WHERE p.deleted_at IS NULL GROUP BY p.member_id
                ), photo_counts AS (
                    SELECT p.member_id, COUNT(*) AS count
                    FROM property_photos photo
                    JOIN properties p ON p.id = photo.property_id AND p.member_id = photo.member_id
                    JOIN recent_members m ON m.id = p.member_id
                    WHERE p.deleted_at IS NULL AND photo.deleted_at IS NULL GROUP BY p.member_id
                )
                SELECT m.id, m.created_at, COALESCE(p.count, 0) AS properties, COALESCE(photo.count, 0) AS photos
                FROM recent_members m
                LEFT JOIN property_counts p ON p.member_id = m.id
                LEFT JOIN photo_counts photo ON photo.member_id = m.id
                ORDER BY m.created_at DESC, m.id DESC
                """, (rs, row) -> new AdminMember(rs.getLong("id"),
                rs.getTimestamp("created_at").toLocalDateTime().toInstant(ZoneOffset.UTC),
                rs.getLong("properties"), rs.getLong("photos")));
    }
}
