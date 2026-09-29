package com.jachwisunbae.property.repository;

import com.jachwisunbae.checklist.type.CheckStage;
import com.jachwisunbae.checklist.type.CheckStatus;
import com.jachwisunbae.property.repository.query.PropertyChecklistApplicationQuery;
import com.jachwisunbae.property.repository.query.PropertyChecklistItemQuery;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcPropertyChecklistRepository implements PropertyChecklistRepository {
    private final JdbcTemplate jdbcTemplate;

    public JdbcPropertyChecklistRepository(final JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void deleteByPropertyAndStage(final long propertyId, final CheckStage stage) {
        jdbcTemplate.update("DELETE FROM property_checklists WHERE property_id = ? AND stage = ?", propertyId, stage.name());
    }

    @Override
    public long save(final long propertyId, final Long sourceChecklistId, final String checklistName,
                     final CheckStage stage) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        String sql = """
                INSERT INTO property_checklists (property_id, user_checklist_id, checklist_name, stage, created_at, updated_at)
                VALUES (?, ?, ?, ?, NOW(6), NOW(6))
                """;
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            statement.setLong(1, propertyId);
            statement.setObject(2, sourceChecklistId);
            statement.setString(3, checklistName);
            statement.setString(4, stage.name());
            return statement;
        }, keyHolder);
        return keyHolder.getKey().longValue();
    }

    @Override
    public Optional<PropertyChecklistApplicationQuery> findApplication(final long memberId, final long propertyId,
                                                                       final long propertyChecklistId) {
        String sqlChecklist = """
                SELECT pc.id, pc.property_id, pc.user_checklist_id, pc.checklist_name, pc.stage
                FROM property_checklists pc
                JOIN properties p ON p.id = pc.property_id
                WHERE p.id = ? AND p.member_id = ? AND pc.id = ?
                """;
        Optional<PropertyChecklistApplicationQuery> checklist = jdbcTemplate.query(
            sqlChecklist,
            (rs, row) -> new PropertyChecklistApplicationQuery(
                rs.getLong("id"),
                rs.getLong("property_id"),
                rs.getObject("user_checklist_id", Long.class),
                rs.getString("checklist_name"),
                CheckStage.valueOf(rs.getString("stage")),
                List.of()
            ),
            propertyId, memberId, propertyChecklistId
        ).stream().findFirst();

        if (checklist.isEmpty()) {
            return Optional.empty();
        }

        String sqlItems = """
                SELECT id, system_check_item_id, question, display_order, status, memo
                FROM property_checklist_items
                WHERE property_checklist_id = ?
                ORDER BY display_order ASC, id ASC
                """;
        List<PropertyChecklistItemQuery> savedItems = jdbcTemplate.query(
            sqlItems,
            (rs, row) -> new PropertyChecklistItemQuery(
                rs.getLong("id"),
                rs.getObject("system_check_item_id", Long.class),
                rs.getString("question"),
                rs.getInt("display_order"),
                CheckStatus.valueOf(rs.getString("status")),
                rs.getString("memo")
            ),
            propertyChecklistId);

        PropertyChecklistApplicationQuery root = checklist.get();
        return Optional.of(new PropertyChecklistApplicationQuery(
            root.id(), root.propertyId(), root.sourceChecklistId(),
            root.checklistName(), root.stage(), savedItems));
    }

}
