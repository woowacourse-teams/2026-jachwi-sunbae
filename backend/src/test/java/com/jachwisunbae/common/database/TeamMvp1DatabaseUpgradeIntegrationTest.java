package com.jachwisunbae.common.database;

import static org.assertj.core.api.Assertions.assertThat;

import com.jachwisunbae.common.IntegrationTest;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

@TestPropertySource(properties = "app.legacy-database-upgrade.enabled=true")
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

    @Test
    void 기존_회원은_NFKC_중복을_분리한_비밀번호_없는_닉네임을_이어받는다() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        jdbcTemplate.update("DELETE FROM members WHERE email IN (?, ?)",
                "legacy-fullwidth@example.com", "legacy-ascii@example.com");
        jdbcTemplate.update("INSERT INTO members (email, name, last_login_at, created_at, updated_at) "
                        + "VALUES (?, ?, ?, ?, ?)",
                "legacy-fullwidth@example.com", "Ａ", now, now, now);
        jdbcTemplate.update("INSERT INTO members (email, name, last_login_at, created_at, updated_at) "
                        + "VALUES (?, ?, ?, ?, ?)",
                "legacy-ascii@example.com", "a", now, now, now);

        databaseUpgradeInitializer.run(new DefaultApplicationArguments());
        databaseUpgradeInitializer.run(new DefaultApplicationArguments());

        List<LegacyCredential> credentials = jdbcTemplate.query("""
                SELECT credential.member_id, credential.nickname, credential.nickname_key, credential.password_hash
                FROM nickname_credentials credential
                JOIN members member ON member.id = credential.member_id
                WHERE member.email IN (?, ?)
                ORDER BY credential.member_id
                """, (resultSet, rowNumber) -> new LegacyCredential(
                        resultSet.getLong("member_id"),
                        resultSet.getString("nickname"),
                        resultSet.getString("nickname_key"),
                        resultSet.getString("password_hash")),
                "legacy-fullwidth@example.com", "legacy-ascii@example.com");

        assertThat(credentials).hasSize(2);
        assertThat(credentials.get(0).nickname()).isEqualTo("A");
        assertThat(credentials.get(0).nicknameKey()).isEqualTo("a");
        assertThat(credentials.get(1).nickname()).isEqualTo("a #" + credentials.get(1).memberId());
        assertThat(credentials).allMatch(credential -> credential.passwordHash() == null);
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

    private record LegacyCredential(long memberId, String nickname, String nicknameKey, String passwordHash) {
    }
}
