package com.jachwisunbae.common.database;

import static org.assertj.core.api.Assertions.assertThat;

import com.jachwisunbae.common.IntegrationTest;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.jdbc.core.JdbcTemplate;

class TeamMvp1DatabaseUpgradeIntegrationTest extends IntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private DatabaseUpgradeInitializer databaseUpgradeInitializer;

    @Test
    void 팀_MVP1_형태를_MVP2_스키마로_반복_업그레이드한다() throws Exception {
        jdbcTemplate.execute("ALTER TABLE properties DROP CHECK ck_properties_location_pair");
        jdbcTemplate.execute("ALTER TABLE properties DROP CHECK ck_properties_latitude");
        jdbcTemplate.execute("ALTER TABLE properties DROP CHECK ck_properties_longitude");
        jdbcTemplate.execute("ALTER TABLE properties DROP COLUMN longitude");
        jdbcTemplate.execute("ALTER TABLE properties DROP COLUMN latitude");
        jdbcTemplate.execute("ALTER TABLE properties DROP COLUMN jibun_address");
        jdbcTemplate.execute("ALTER TABLE properties DROP COLUMN road_address");
        jdbcTemplate.execute("ALTER TABLE members DROP COLUMN last_login_at");
        jdbcTemplate.execute("ALTER TABLE property_memo_items "
                + "RENAME COLUMN system_memo_item_id TO system_meno_id");
        jdbcTemplate.execute("ALTER TABLE main_property_photos "
                + "DROP FOREIGN KEY fk_main_property_photos_photo_owner");
        jdbcTemplate.execute("ALTER TABLE main_property_photos "
                + "ADD CONSTRAINT fk_main_property_photos_photo "
                + "FOREIGN KEY (property_photos_id) REFERENCES property_photos (id)");
        jdbcTemplate.execute("ALTER TABLE property_photos "
                + "DROP INDEX uk_property_photos_property_id");
        jdbcTemplate.execute("ALTER TABLE main_property_photos "
                + "DROP INDEX uk_main_property_photos_property");

        LocalDateTime now = LocalDateTime.now();
        jdbcTemplate.update("INSERT INTO members (email, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
                "team-mvp1@example.com", "기존 팀 사용자", now, now);
        jdbcTemplate.update("""
                INSERT INTO system_memo_items (id, label, display_order, deleted_at)
                VALUES (5, '기존 추가 메모 1', 5, NULL), (6, '기존 추가 메모 2', 6, NULL)
                ON DUPLICATE KEY UPDATE deleted_at = NULL
                """);

        databaseUpgradeInitializer.run(new DefaultApplicationArguments());
        databaseUpgradeInitializer.run(new DefaultApplicationArguments());

        assertThat(columnExists("members", "last_login_at")).isTrue();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT last_login_at FROM members WHERE email = 'team-mvp1@example.com'",
                LocalDateTime.class)).isNotNull();
        assertThat(columnExists("properties", "road_address")).isTrue();
        assertThat(columnExists("properties", "jibun_address")).isTrue();
        assertThat(columnExists("properties", "latitude")).isTrue();
        assertThat(columnExists("properties", "longitude")).isTrue();
        assertThat(columnExists("property_memo_items", "system_memo_item_id")).isTrue();
        assertThat(columnExists("property_memo_items", "system_meno_id")).isFalse();
        assertThat(indexExists("property_photos", "uk_property_photos_property_id")).isTrue();
        assertThat(indexExists("main_property_photos", "uk_main_property_photos_property")).isTrue();
        assertThat(constraintExists("main_property_photos", "fk_main_property_photos_photo_owner")).isTrue();
        assertThat(constraintExists("properties", "ck_properties_location_pair")).isTrue();
        assertThat(constraintExists("properties", "ck_properties_latitude")).isTrue();
        assertThat(constraintExists("properties", "ck_properties_longitude")).isTrue();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM system_memo_items WHERE id IN (5, 6) AND deleted_at IS NOT NULL",
                Long.class)).isEqualTo(2L);
    }

    private boolean columnExists(String tableName, String columnName) {
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject("""
                SELECT EXISTS(
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?
                )
                """, Boolean.class, tableName, columnName));
    }

    private boolean indexExists(String tableName, String indexName) {
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject("""
                SELECT EXISTS(
                    SELECT 1
                    FROM information_schema.statistics
                    WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?
                )
                """, Boolean.class, tableName, indexName));
    }

    private boolean constraintExists(String tableName, String constraintName) {
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject("""
                SELECT EXISTS(
                    SELECT 1
                    FROM information_schema.table_constraints
                    WHERE constraint_schema = DATABASE() AND table_name = ? AND constraint_name = ?
                )
                """, Boolean.class, tableName, constraintName));
    }
}
