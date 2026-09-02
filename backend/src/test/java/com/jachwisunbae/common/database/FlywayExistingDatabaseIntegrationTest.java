package com.jachwisunbae.common.database;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
class FlywayExistingDatabaseIntegrationTest {

    private static final String LEGACY_HISTORY_MARKER = "mvp1";

    @Container
    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4.10");

    @Container
    private static final MySQLContainer<?> FRESH_MYSQL = new MySQLContainer<>("mysql:8.4.10");

    @Test
    void 기존_스키마를_baseline하고_통합_데이터를_backfill한다() {
        DataSource dataSource = dataSource();
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        new ResourceDatabasePopulator(new ClassPathResource("db/init/001-schema.sql")).execute(dataSource);

        long memberId = insertLegacyMember(jdbcTemplate, "legacy@example.com", "레거시 회원");
        long passwordlessMemberId = insertLegacyMember(jdbcTemplate, "unclaimed@example.com", "소유권 미확인 회원");
        jdbcTemplate.update("""
                INSERT INTO nickname_credentials (
                    member_id, nickname, nickname_key, password_hash, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?)
                """, memberId, "레거시닉네임", "레거시닉네임",
                "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", timestamp(), timestamp());

        long propertyId = insertLegacyProperty(jdbcTemplate, memberId);
        long photoId = insertLegacyPhoto(jdbcTemplate, propertyId, memberId);
        long userChecklistId = insertLegacyChecklist(jdbcTemplate, memberId);
        insertLegacyChecklistItems(jdbcTemplate, userChecklistId);
        insertLegacyPropertyChecklist(jdbcTemplate, propertyId, userChecklistId);
        jdbcTemplate.update("INSERT INTO property_memos (property_id, free_memo) VALUES (?, ?)",
                propertyId, "자유 메모 원문");
        long memoId = jdbcTemplate.queryForObject(
                "SELECT id FROM property_memos WHERE property_id = ?", Long.class, propertyId);
        seedLegacyMemoItems(jdbcTemplate, memoId);

        long invalidPropertyId = insertLegacyProperty(jdbcTemplate, passwordlessMemberId);
        jdbcTemplate.update("INSERT INTO property_memos (property_id, free_memo) VALUES (?, ?)",
                invalidPropertyId, "잘못된 구조화 메모도 자유 메모는 보존한다");
        long invalidMemoId = jdbcTemplate.queryForObject(
                "SELECT id FROM property_memos WHERE property_id = ?", Long.class, invalidPropertyId);
        jdbcTemplate.batchUpdate("""
                INSERT INTO property_memo_items (
                    property_memo_id, system_memo_item_id, label, display_order, content
                ) VALUES (?, ?, ?, ?, ?)
                """, List.of(
                new Object[]{invalidMemoId, 1L, "입주 가능일", 1, "2026-99-99"},
                new Object[]{invalidMemoId, 3L, "관리비 및 공과금", 3, "비쌈"},
                new Object[]{invalidMemoId, 4L, "방문 일정", 4, "2026-02-31 15:30"}
        ));
        long overflowPropertyId = insertLegacyProperty(jdbcTemplate, memberId);
        jdbcTemplate.update("INSERT INTO property_memos (property_id, free_memo) VALUES (?, ?)",
                overflowPropertyId, "범위를 벗어난 관리비도 자유 메모는 보존한다");
        long overflowMemoId = jdbcTemplate.queryForObject(
                "SELECT id FROM property_memos WHERE property_id = ?", Long.class, overflowPropertyId);
        jdbcTemplate.update("""
                INSERT INTO property_memo_items (
                    property_memo_id, system_memo_item_id, label, display_order, content
                ) VALUES (?, ?, ?, ?, ?)
                """, overflowMemoId, 3L, "관리비 및 공과금", 3,
                "999999999999999999999999원");
        jdbcTemplate.execute("""
                CREATE TABLE flyway_schema_history (
                    id INT PRIMARY KEY,
                    marker VARCHAR(20) NOT NULL
                )
                """);
        jdbcTemplate.update("INSERT INTO flyway_schema_history (id, marker) VALUES (1, ?)", LEGACY_HISTORY_MARKER);

        Flyway flyway = flyway(dataSource);

        flyway.migrate();

        assertThat(flyway.info().pending()).isEmpty();
        assertThat(jdbcTemplate.queryForList(
                "SELECT version FROM integrated_schema_history ORDER BY installed_rank", String.class))
                .containsExactly("1", "2", "3", "4", "5");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT type FROM integrated_schema_history WHERE version = '1'", String.class))
                .isEqualTo("BASELINE");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT marker FROM flyway_schema_history WHERE id = 1", String.class))
                .isEqualTo(LEGACY_HISTORY_MARKER);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT row_count FROM migration_legacy_stage_counts "
                        + "WHERE migration_version = 'V3' AND source_table = 'system_check_items' "
                        + "AND stage = 'ONLINE_PHONE'", Long.class)).isEqualTo(12L);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM property_photos WHERE property_id = ? AND member_id = ?",
                Long.class, propertyId, memberId)).isEqualTo(1L);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM main_property_photos WHERE property_id = ? AND property_photos_id = ?",
                Long.class, propertyId, photoId)).isEqualTo(1L);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT name FROM user_checklists WHERE id = ?", String.class, userChecklistId))
                .isEqualTo("현장 확인");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT member_id FROM user_checklists WHERE id = ?", Long.class, userChecklistId))
                .isEqualTo(memberId);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM user_checklist_items WHERE user_checklist_id = ? AND question = ?",
                Long.class, userChecklistId, "엘리베이터 확인")).isEqualTo(1L);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM property_checklists WHERE property_id = ? AND user_checklist_id = ?",
                Long.class, propertyId, userChecklistId)).isEqualTo(1L);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM property_checklist_items AS item "
                        + "JOIN property_checklists AS checklist ON checklist.id = item.property_checklist_id "
                        + "WHERE checklist.property_id = ? AND item.memo = ?",
                Long.class, propertyId, "창문 잠금 확인")).isEqualTo(1L);

        assertThat(jdbcTemplate.queryForObject(
                "SELECT nickname FROM members WHERE id = ?", String.class, memberId))
                .isEqualTo("레거시닉네임");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT password_hash FROM members WHERE id = ?", String.class, memberId))
                .isEqualTo("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT nickname FROM members WHERE id = ?", String.class, passwordlessMemberId))
                .isNull();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT address FROM properties WHERE id = ?", String.class, propertyId))
                .isEqualTo("서울 관악구 신림로 12길 3");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT character_maximum_length FROM information_schema.columns "
                        + "WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'address'",
                Long.class)).isEqualTo(500L);

        assertThat(jdbcTemplate.queryForObject(
                "SELECT available_move_in_date FROM property_details WHERE property_id = ?",
                LocalDate.class, propertyId)).isEqualTo(LocalDate.of(2026, 12, 1));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT maintenance_fee_amount FROM property_details WHERE property_id = ?",
                Long.class, propertyId)).isNull();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT visit_scheduled_at FROM property_details WHERE property_id = ?",
                LocalDateTime.class, propertyId)).isEqualTo(LocalDateTime.of(2026, 12, 2, 15, 30));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT discovery_source FROM property_details WHERE property_id = ?",
                String.class, propertyId)).isEqualTo("중개사 추천");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT free_memo FROM property_memos WHERE id = ?", String.class, memoId))
                .isEqualTo("자유 메모 원문");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT free_memo FROM property_memos WHERE id = ?", String.class, invalidMemoId))
                .isEqualTo("잘못된 구조화 메모도 자유 메모는 보존한다");
        assertThat(jdbcTemplate.queryForList(
                "SELECT option_code FROM property_room_options WHERE property_id = ? ORDER BY option_code",
                String.class, propertyId)).containsExactly("AIR_CONDITIONER", "INDUCTION", "REFRIGERATOR");
        assertThat(jdbcTemplate.queryForList(
                "SELECT utility_code FROM property_utility_options WHERE property_id = ? ORDER BY utility_code",
                String.class, propertyId)).containsExactly("ELECTRICITY", "WATER");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM migration_backfill_failures "
                        + "WHERE migration_version = 'V4' AND target_column = 'maintenance_fee_amount'",
                Long.class)).isEqualTo(3L);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM migration_backfill_failures "
                        + "WHERE migration_version = 'V4' AND target_column = 'available_move_in_date'",
                Long.class)).isEqualTo(1L);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM migration_backfill_failures "
                        + "WHERE migration_version = 'V4' AND target_column = 'visit_scheduled_at'",
                Long.class)).isEqualTo(1L);
        Map<String, Object> invalidDetails = jdbcTemplate.queryForMap(
                "SELECT available_move_in_date, visit_scheduled_at FROM property_details WHERE property_id = ?",
                invalidPropertyId);
        assertThat(invalidDetails.get("available_move_in_date")).isNull();
        assertThat(invalidDetails.get("visit_scheduled_at")).isNull();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT maintenance_fee_amount FROM property_details WHERE property_id = ?",
                Long.class, overflowPropertyId)).isNull();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT free_memo FROM property_memos WHERE property_id = ?", String.class, overflowPropertyId))
                .isEqualTo("범위를 벗어난 관리비도 자유 메모는 보존한다");

        JdbcTemplate freshJdbcTemplate = new JdbcTemplate(freshDataSource());
        flyway(freshJdbcTemplate.getDataSource()).migrate();
        assertThat(schemaSignature(jdbcTemplate)).isEqualTo(schemaSignature(freshJdbcTemplate));
    }

    private DataSource dataSource() {
        return new DriverManagerDataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword());
    }

    private DataSource freshDataSource() {
        return new DriverManagerDataSource(
                FRESH_MYSQL.getJdbcUrl(), FRESH_MYSQL.getUsername(), FRESH_MYSQL.getPassword());
    }

    private Flyway flyway(DataSource dataSource) {
        return Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .table("integrated_schema_history")
                .baselineOnMigrate(true)
                .baselineVersion("1")
                .baselineDescription("pre-flyway-mvp2-schema")
                .validateOnMigrate(true)
                .callbacks(new IntegratedSchemaBaselineGuard())
                .load();
    }

    private long insertLegacyMember(JdbcTemplate jdbcTemplate, String email, String name) {
        LocalDateTime timestamp = timestamp();
        jdbcTemplate.update("""
                INSERT INTO members (email, name, last_login_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                """, email, name, timestamp, timestamp, timestamp);
        return jdbcTemplate.queryForObject("SELECT id FROM members WHERE email = ?", Long.class, email);
    }

    private long insertLegacyProperty(JdbcTemplate jdbcTemplate, long memberId) {
        LocalDateTime timestamp = timestamp();
        jdbcTemplate.update("""
                INSERT INTO properties (
                    member_id, name, deposit_amount, monthly_rent_amount, discovery_source,
                    road_address, jibun_address, latitude, longitude, created_at, updated_at, last_activity_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, memberId, "레거시 매물", 10_000_000L, 550_000L, "", "서울 관악구 신림로 12길 3",
                "서울 관악구 신림동 123-4", new BigDecimal("37.4841234"), new BigDecimal("126.9291234"),
                timestamp, timestamp, timestamp);
        return jdbcTemplate.queryForObject(
                "SELECT id FROM properties WHERE member_id = ? ORDER BY id DESC LIMIT 1", Long.class, memberId);
    }

    private long insertLegacyPhoto(JdbcTemplate jdbcTemplate, long propertyId, long memberId) {
        jdbcTemplate.update("""
                INSERT INTO property_photos (
                    property_id, member_id, storage_key, content_type, size_bytes,
                    checksum_sha256, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, propertyId, memberId, "legacy/property.jpg", "image/jpeg", 123L,
                "a".repeat(64), timestamp());
        long photoId = jdbcTemplate.queryForObject(
                "SELECT id FROM property_photos WHERE storage_key = ?", Long.class, "legacy/property.jpg");
        jdbcTemplate.update("INSERT INTO main_property_photos (property_id, property_photos_id) VALUES (?, ?)",
                propertyId, photoId);
        return photoId;
    }

    private long insertLegacyChecklist(JdbcTemplate jdbcTemplate, long memberId) {
        jdbcTemplate.update("INSERT INTO user_checklists (member_id, name, stage) VALUES (?, ?, ?)",
                memberId, "현장 확인", "ON_SITE");
        return jdbcTemplate.queryForObject(
                "SELECT id FROM user_checklists WHERE member_id = ? ORDER BY id DESC LIMIT 1", Long.class, memberId);
    }

    private void insertLegacyChecklistItems(JdbcTemplate jdbcTemplate, long userChecklistId) {
        jdbcTemplate.update("""
                INSERT INTO user_checklist_items (
                    user_checklist_id, system_check_item_id, stage, item_type, question, display_order
                ) VALUES (?, NULL, ?, ?, ?, ?)
                """, userChecklistId, "ON_SITE", "CUSTOM", "엘리베이터 확인", 1);
    }

    private void insertLegacyPropertyChecklist(JdbcTemplate jdbcTemplate, long propertyId, long userChecklistId) {
        jdbcTemplate.update("""
                INSERT INTO property_checklists (
                    property_id, user_checklist_id, checklist_name, stage
                ) VALUES (?, ?, ?, ?)
                """, propertyId, userChecklistId, "현장 확인", "ON_SITE");
        long propertyChecklistId = jdbcTemplate.queryForObject(
                "SELECT id FROM property_checklists WHERE property_id = ? AND stage = ?",
                Long.class, propertyId, "ON_SITE");
        jdbcTemplate.update("""
                INSERT INTO property_checklist_items (
                    property_checklist_id, system_check_item_id, display_order,
                    status, memo, question
                ) VALUES (?, NULL, ?, ?, ?, ?)
                """, propertyChecklistId, 1, "UNCONFIRMED", "창문 잠금 확인", "창문 잠금 확인");
    }

    private void seedLegacyMemoItems(JdbcTemplate jdbcTemplate, long memoId) {
        jdbcTemplate.batchUpdate("""
                INSERT INTO system_memo_items (id, label, display_order, deleted_at)
                VALUES (?, ?, ?, NULL)
                """, List.of(
                new Object[]{1L, "입주 가능일", 1},
                new Object[]{2L, "방 옵션", 2},
                new Object[]{3L, "관리비 및 공과금", 3},
                new Object[]{4L, "방문 일정", 4},
                new Object[]{5L, "확인한 곳", 5}
        ));
        jdbcTemplate.batchUpdate("""
                INSERT INTO property_memo_items (
                    property_memo_id, system_memo_item_id, label, display_order, content
                ) VALUES (?, ?, ?, ?, ?)
                """, List.of(
                new Object[]{memoId, 1L, "입주 가능일", 1, "2026.12.01"},
                new Object[]{memoId, 2L, "방 옵션", 2, "에어컨, 냉장고, 인덕션"},
                new Object[]{memoId, 3L, "관리비 및 공과금", 3, "10만원, 수도·전기 포함"},
                new Object[]{memoId, 4L, "방문 일정", 4, "2026-12-02 15:30"},
                new Object[]{memoId, 5L, "확인한 곳", 5, "중개사 추천"}
        ));
    }

    private LocalDateTime timestamp() {
        return LocalDateTime.of(2026, 1, 2, 3, 4, 5);
    }

    private Set<String> schemaSignature(JdbcTemplate jdbcTemplate) {
        Set<String> signature = new HashSet<>();
        signature.addAll(jdbcTemplate.queryForList("""
                SELECT CONCAT(
                    'column|', table_name, '|', column_name, '|',
                    REPLACE(LOWER(column_type), ' unsigned', ''), '|', is_nullable, '|',
                    COALESCE(character_maximum_length, ''), '|', COALESCE(numeric_precision, ''), '|',
                    COALESCE(numeric_scale, ''), '|', COALESCE(column_default, '<null>')
                )
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name NOT IN ('integrated_schema_history', 'flyway_schema_history')
                ORDER BY table_name, ordinal_position
                """, String.class));
        signature.addAll(jdbcTemplate.queryForList("""
                SELECT CONCAT(
                    'index|', table_name, '|', index_name, '|', non_unique, '|', seq_in_index, '|',
                    column_name, '|', COALESCE(collation, ''), '|', index_type
                )
                FROM information_schema.statistics
                WHERE table_schema = DATABASE()
                  AND table_name NOT IN ('integrated_schema_history', 'flyway_schema_history')
                ORDER BY table_name, index_name, seq_in_index
                """, String.class));
        signature.addAll(jdbcTemplate.queryForList("""
                SELECT CONCAT(
                    'foreign-key|', table_name, '|', constraint_name, '|', column_name, '|',
                    referenced_table_name, '|', referenced_column_name
                )
                FROM information_schema.key_column_usage
                WHERE table_schema = DATABASE()
                  AND referenced_table_name IS NOT NULL
                  AND table_name NOT IN ('integrated_schema_history', 'flyway_schema_history')
                ORDER BY table_name, constraint_name, ordinal_position
                """, String.class));
        return signature;
    }
}
