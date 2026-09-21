package com.jachwisunbae.property.repository;

import com.jachwisunbae.property.entity.PropertyMemo;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.Objects;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcPropertyMemoRepository implements PropertyMemoRepository {
    private final JdbcTemplate jdbcTemplate;

    public JdbcPropertyMemoRepository(final JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<PropertyMemo> findByPropertyId(final long propertyId) {
        String sql = "SELECT id, property_id, free_memo FROM property_memos WHERE property_id = ?";
        return jdbcTemplate.query(sql, (rs, rowNum) -> PropertyMemo.reconstruct(
            rs.getLong("id"),
            rs.getLong("property_id"),
            rs.getString("free_memo")
        ), propertyId).stream().findFirst();
    }

    @Override
    public PropertyMemo save(final PropertyMemo memo) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        String sql = "INSERT INTO property_memos (property_id, free_memo) VALUES (?, ?)";

        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            statement.setLong(1, memo.getPropertyId());
            statement.setString(2, memo.getFreeMemo());
            return statement;
        }, keyHolder);

        long generatedId = Objects.requireNonNull(keyHolder.getKey()).longValue();
        return PropertyMemo.reconstruct(generatedId, memo.getPropertyId(), memo.getFreeMemo());
    }

    @Override
    public void update(final PropertyMemo memo) {
        String sql = "UPDATE property_memos SET free_memo = ? WHERE id = ?";
        jdbcTemplate.update(sql, memo.getFreeMemo(), memo.getId());
    }

    @Override
    public void deleteByPropertyId(final long propertyId) {
        // 명세 5.6: 부모 매물 삭제 시 하위 데이터는 논리적으로 처리되거나 비노출되지만,
        // 물리 삭제가 필요한 경우 property_memos만 단일 정리합니다.
        String sql = "DELETE FROM property_memos WHERE property_id = ?";
        jdbcTemplate.update(sql, propertyId);
    }
}
