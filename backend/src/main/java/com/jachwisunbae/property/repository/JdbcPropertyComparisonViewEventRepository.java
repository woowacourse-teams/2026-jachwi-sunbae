package com.jachwisunbae.property.repository;

import java.time.LocalDateTime;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcPropertyComparisonViewEventRepository implements PropertyComparisonViewEventRepository {

    private final JdbcTemplate jdbcTemplate;

    public JdbcPropertyComparisonViewEventRepository(final JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void save(final long memberId, final int propertyCount, final LocalDateTime viewedAt) {
        jdbcTemplate.update("""
                INSERT INTO property_comparison_view_events (member_id, property_count, viewed_at)
                VALUES (?, ?, ?)
                """, memberId, propertyCount, viewedAt);
    }
}
