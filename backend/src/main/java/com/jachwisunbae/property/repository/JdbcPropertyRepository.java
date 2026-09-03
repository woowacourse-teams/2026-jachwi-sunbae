package com.jachwisunbae.property.repository;

import com.jachwisunbae.property.entity.Property;
import com.jachwisunbae.property.repository.query.PropertyListItemQuery;
import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcPropertyRepository implements PropertyRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<PropertyListItemQuery> propertyListRowMapper = (rs, row) -> new PropertyListItemQuery(
        rs.getLong("id"),
        rs.getString("name"),
        rs.getObject("deposit_amount", Long.class),
        rs.getObject("monthly_rent_amount", Long.class),
        rs.getString("discovery_source"),
        rs.getString("address"),
        rs.getBigDecimal("latitude"),
        rs.getBigDecimal("longitude"),
        rs.getObject("photo_id", Long.class),
        rs.getString("storage_key"),
        rs.getString("content_type"),
        rs.getInt("photo_count"),
        rs.getInt("total_count"),
        rs.getInt("completed_count"),
        rs.getInt("good_count"),
        rs.getInt("caution_count"),
        rs.getInt("unconfirmed_count")
    );

    public JdbcPropertyRepository(final JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public List<PropertyListItemQuery> findListByMemberId(final long memberId) {
        String sql = """
                SELECT p.id, p.member_id, p.name, p.deposit_amount, p.monthly_rent_amount,
                       p.address, p.latitude, p.longitude,
                       pd.discovery_source,
                       ph.id AS photo_id, ph.storage_key, ph.content_type,
                       (SELECT COUNT(*) FROM property_photos pph WHERE pph.property_id = p.id AND pph.deleted_at IS NULL) AS photo_count,
                       COALESCE(progress.total_count, 0) AS total_count,
                       COALESCE(progress.completed_count, 0) AS completed_count,
                       COALESCE(progress.good_count, 0) AS good_count,
                       COALESCE(progress.caution_count, 0) AS caution_count,
                       COALESCE(progress.unconfirmed_count, 0) AS unconfirmed_count
                FROM properties p
                LEFT JOIN property_details pd ON pd.property_id = p.id
                LEFT JOIN main_property_photos mp ON mp.property_id = p.id
                LEFT JOIN property_photos ph ON ph.id = mp.property_photos_id AND ph.deleted_at IS NULL
                LEFT JOIN (
                    SELECT pc.property_id, COUNT(pci.id) AS total_count,
                           SUM(pci.status IN ('GOOD', 'CAUTION')) AS completed_count,
                           SUM(pci.status = 'GOOD') AS good_count,
                           SUM(pci.status = 'CAUTION') AS caution_count,
                           SUM(pci.status = 'UNCONFIRMED') AS unconfirmed_count
                    FROM property_checklists pc
                    LEFT JOIN property_checklist_items pci ON pci.property_checklist_id = pc.id
                    GROUP BY pc.property_id
                ) progress ON progress.property_id = p.id
                WHERE p.member_id = ? AND p.deleted_at IS NULL
                GROUP BY p.id, p.member_id, p.name, p.deposit_amount, p.monthly_rent_amount,
                         p.address, p.latitude, p.longitude, pd.discovery_source,
                         ph.id, ph.storage_key, ph.content_type,
                         progress.total_count, progress.completed_count, progress.good_count,
                         progress.caution_count, progress.unconfirmed_count
                ORDER BY p.id DESC
                """;
        return jdbcTemplate.query(sql, propertyListRowMapper, memberId);
    }

    @Override
    public int countByMemberId(final long memberId) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM properties WHERE member_id = ? AND deleted_at IS NULL",
            Integer.class, memberId);
        return count == null ? 0 : count;
    }

    @Override
    public Property save(final Property property) {
        String sql = """
                INSERT INTO properties
                    (member_id, name, deposit_amount, monthly_rent_amount,
                     address, latitude, longitude, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            statement.setLong(1, property.getMemberId());
            statement.setString(2, property.getName());
            statement.setObject(3, property.getDepositAmount());
            statement.setObject(4, property.getMonthlyRentAmount());
            statement.setString(5, property.getAddress());
            statement.setBigDecimal(6, property.getLatitude());
            statement.setBigDecimal(7, property.getLongitude());
            statement.setObject(8, property.getCreatedAt());
            return statement;
        }, keyHolder);

        long generatedId = keyHolder.getKey().longValue();
        return Property.reconstruct(
            generatedId,
            property.getMemberId(),
            property.getName(),
            property.getDepositAmount(),
            property.getMonthlyRentAmount(),
            property.getDiscoverySource(),
            property.getAddress(),
            property.getLatitude(),
            property.getLongitude(),
            property.getCreatedAt(),
            property.getUpdatedAt()
        );
    }

    @Override
    public Optional<Property> findByIdAndMemberId(final long propertyId, final long memberId) {
        String sql = """
                SELECT p.id, p.member_id, p.name, p.deposit_amount, p.monthly_rent_amount,
                       p.address, p.latitude, p.longitude, p.created_at,
                       pd.discovery_source, pd.updated_at
                FROM properties p
                LEFT JOIN property_details pd ON pd.property_id = p.id
                WHERE p.id = ? AND p.member_id = ? AND p.deleted_at IS NULL
                """;
        return jdbcTemplate.query(sql, (rs, row) -> Property.reconstruct(
            rs.getLong("id"),
            rs.getLong("member_id"),
            rs.getString("name"),
            rs.getObject("deposit_amount", Long.class),
            rs.getObject("monthly_rent_amount", Long.class),
            rs.getString("discovery_source"),
            rs.getString("address"),
            rs.getBigDecimal("latitude"),
            rs.getBigDecimal("longitude"),
            rs.getTimestamp("created_at").toLocalDateTime(),
            rs.getTimestamp("updated_at") == null ? rs.getTimestamp("created_at").toLocalDateTime() : rs.getTimestamp("updated_at").toLocalDateTime()
        ), propertyId, memberId).stream().findFirst();
    }

    @Override
    public boolean existsByIdAndMemberId(final long propertyId, final long memberId) {
        Boolean exists = jdbcTemplate.queryForObject(
            "SELECT EXISTS (SELECT 1 FROM properties WHERE id = ? AND member_id = ? AND deleted_at IS NULL)",
            Boolean.class, propertyId, memberId);
        return Boolean.TRUE.equals(exists);
    }

    @Override
    public Optional<Property> findByIdAndMemberIdForUpdate(final long propertyId, final long memberId) {
        String sql = """
                SELECT p.id, p.member_id, p.name, p.deposit_amount, p.monthly_rent_amount,
                       p.address, p.latitude, p.longitude, p.created_at,
                       pd.discovery_source, pd.updated_at
                FROM properties p
                LEFT JOIN property_details pd ON pd.property_id = p.id
                WHERE p.id = ? AND p.member_id = ? AND p.deleted_at IS NULL
                FOR UPDATE
                """;
        return jdbcTemplate.query(sql, (rs, row) -> Property.reconstruct(
            rs.getLong("id"),
            rs.getLong("member_id"),
            rs.getString("name"),
            rs.getObject("deposit_amount", Long.class),
            rs.getObject("monthly_rent_amount", Long.class),
            rs.getString("discovery_source"),
            rs.getString("address"),
            rs.getBigDecimal("latitude"),
            rs.getBigDecimal("longitude"),
            rs.getTimestamp("created_at").toLocalDateTime(),
            rs.getTimestamp("updated_at") == null ? rs.getTimestamp("created_at").toLocalDateTime() : rs.getTimestamp("updated_at").toLocalDateTime()
        ), propertyId, memberId).stream().findFirst();
    }

    @Override
    public Property update(final Property property) {
        String sql = """
                UPDATE properties
                SET name = ?, deposit_amount = ?, monthly_rent_amount = ?,
                    address = ?, latitude = ?, longitude = ?
                WHERE id = ? AND member_id = ? AND deleted_at IS NULL
                """;
        jdbcTemplate.update(sql,
            property.getName(),
            property.getDepositAmount(),
            property.getMonthlyRentAmount(),
            property.getAddress(),
            property.getLatitude(),
            property.getLongitude(),
            property.getId(),
            property.getMemberId()
        );
        return property;
    }

    @Override
    public void deleteById(final long propertyId) {
        jdbcTemplate.update("UPDATE properties SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL", propertyId);
    }
}
