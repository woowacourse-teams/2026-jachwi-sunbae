package com.jachwisunbae.common.database;

import static org.assertj.core.api.Assertions.assertThat;

import com.jachwisunbae.common.IntegrationTest;
import java.util.List;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;

class DatabaseInitializationTest extends IntegrationTest {

    private static final List<String> APPLICATION_TABLES = List.of(
            "members",
            "nickname_credentials",
            "properties",
            "property_comparison_view_events",
            "property_photos",
            "main_property_photos",
            "system_memo_items",
            "property_memos",
            "property_memo_items",
            "property_details",
            "property_room_options",
            "property_utility_options",
            "member_checklist_preferences",
            "migration_backfill_failures",
            "system_check_items",
            "user_checklists",
            "user_checklist_items",
            "property_checklists",
            "property_checklist_items"
    );

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private Flyway flyway;

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    void 현재_스키마와_기본_데이터로_새_DB를_초기화한다() {
        List<String> tables = jdbcTemplate.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()",
                String.class
        );

        assertThat(tables).containsAll(APPLICATION_TABLES);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM system_check_items WHERE deleted_at IS NULL", Long.class)).isEqualTo(53);
        assertThat(jdbcTemplate.queryForList("""
                SELECT stage, item_type, COUNT(*) AS item_count
                FROM system_check_items
                WHERE deleted_at IS NULL
                GROUP BY stage, item_type
                ORDER BY FIELD(stage, 'ONLINE_PHONE', 'ON_SITE', 'PRE_CONTRACT'), item_type
                """)).containsExactly(
                java.util.Map.of("stage", "ONLINE_PHONE", "item_type", "CORE", "item_count", 6L),
                java.util.Map.of("stage", "ONLINE_PHONE", "item_type", "OPTIONAL", "item_count", 6L),
                java.util.Map.of("stage", "ON_SITE", "item_type", "CORE", "item_count", 8L),
                java.util.Map.of("stage", "ON_SITE", "item_type", "OPTIONAL", "item_count", 19L),
                java.util.Map.of("stage", "PRE_CONTRACT", "item_type", "CORE", "item_count", 7L),
                java.util.Map.of("stage", "PRE_CONTRACT", "item_type", "OPTIONAL", "item_count", 7L));
        assertThat(count("system_memo_items")).isEqualTo(5);
        assertThat(jdbcTemplate.queryForList(
                "SELECT label FROM system_memo_items ORDER BY display_order",
                String.class
        )).containsExactly("입주 가능일", "방 옵션", "관리비 및 공과금", "방문 일정", "확인한 곳");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT question FROM system_check_items WHERE id = 101",
                String.class
        )).isEqualTo("보증금과 월세, 관리비는 어떤가요?");
        assertThat(nullableColumn("user_checklist_items", "system_check_item_id")).isEqualTo("YES");
        assertThat(nullableColumn("property_checklist_items", "system_check_item_id")).isEqualTo("YES");
        assertThat(nullableColumn("members", "nickname")).isEqualTo("YES");
        assertThat(nullableColumn("members", "nickname_key")).isEqualTo("YES");
        assertThat(nullableColumn("members", "password_hash")).isEqualTo("YES");
        assertThat(nullableColumn("properties", "address")).isEqualTo("YES");
        assertThat(columnLength("properties", "address")).isEqualTo(500L);
        assertThat(nullableColumn("properties", "deleted_at")).isEqualTo("YES");
        assertThat(nullableColumn("property_photos", "deleted_at")).isEqualTo("YES");
        assertThat(nullableColumn("user_checklists", "deleted_at")).isEqualTo("YES");
        assertThat(nullableColumn("property_details", "maintenance_fee_amount")).isEqualTo("YES");
        assertThat(nullableColumn("property_details", "discovery_source")).isEqualTo("YES");
        assertThat(indexExists("members", "uk_members_nickname_key")).isTrue();
        assertThat(indexExists("properties", "idx_properties_member_deleted_created")).isTrue();
        assertThat(indexExists("property_room_options", "PRIMARY")).isTrue();
        assertThat(indexExists("property_utility_options", "PRIMARY")).isTrue();
        assertThat(indexExists("member_checklist_preferences", "idx_member_checklist_preferences_latest")).isTrue();
        assertThat(count("migration_backfill_failures")).isZero();
    }

    @Test
    void Flyway는_적용된_버전을_기록하고_재실행에서_중복_적용하지_않는다() {
        Long historyCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM integrated_schema_history WHERE success = TRUE", Long.class);
        int pendingBefore = flyway.info().pending().length;
        assertThat(pendingBefore).isZero();

        flyway.migrate();

        assertThat(historyCount).isEqualTo((long) flyway.info().applied().length);
        assertThat(flyway.info().pending()).hasSize(pendingBefore);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM integrated_schema_history WHERE success = TRUE", Long.class))
                .isEqualTo(historyCount);
    }

    @Test
    void 레거시_애플리케이션_시작_업그레이더는_기본_프로필에서_등록하지_않는다() {
        assertThat(applicationContext.getBeansOfType(DatabaseUpgradeInitializer.class)).isEmpty();
    }

    private Long count(String tableName) {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + tableName, Long.class);
    }

    private String nullableColumn(String tableName, String columnName) {
        return jdbcTemplate.queryForObject("""
                SELECT is_nullable
                FROM information_schema.columns
                WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?
                """, String.class, tableName, columnName);
    }

    private Long columnLength(String tableName, String columnName) {
        return jdbcTemplate.queryForObject("""
                SELECT character_maximum_length
                FROM information_schema.columns
                WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?
                """, Long.class, tableName, columnName);
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

}
