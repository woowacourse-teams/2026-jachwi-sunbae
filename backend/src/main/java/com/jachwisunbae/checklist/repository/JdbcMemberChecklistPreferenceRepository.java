package com.jachwisunbae.checklist.repository;

import com.jachwisunbae.checklist.type.CheckStage;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcMemberChecklistPreferenceRepository implements MemberChecklistPreferenceRepository {

    private final JdbcTemplate jdbcTemplate;

    public JdbcMemberChecklistPreferenceRepository(final JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Long findUserChecklistId(final long memberId, final CheckStage stage) {
        String sql = """
                SELECT user_checklist_id
                FROM member_checklist_preferences
                WHERE member_id = ? AND stage = ?
                """;
        return jdbcTemplate.query(sql, resultSet -> {
            if (!resultSet.next()) {
                return null;
            }
            return resultSet.getObject("user_checklist_id", Long.class);
        }, memberId, stage.name());
    }

    @Override
    public void save(final long memberId, final CheckStage stage, final Long userChecklistId) {
        String sql = """
                INSERT INTO member_checklist_preferences (member_id, stage, user_checklist_id, updated_at)
                VALUES (?, ?, ?, NOW(6))
                ON DUPLICATE KEY UPDATE user_checklist_id = VALUES(user_checklist_id), updated_at = NOW(6)
                """;
        jdbcTemplate.update(sql, memberId, stage.name(), userChecklistId);
    }
}
