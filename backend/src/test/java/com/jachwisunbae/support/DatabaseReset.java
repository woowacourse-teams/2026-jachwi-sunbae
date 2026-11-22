package com.jachwisunbae.support;

import java.util.List;
import org.flywaydb.core.Flyway;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;

// 컨테이너를 함께 쓰므로 테스트 클래스마다 이전 클래스가 남긴 데이터를 지운다.
// 마이그레이션이 넣은 기본 데이터는 처음 마이그레이션한 직후 복사해 두고 매번 되돌린다.
public final class DatabaseReset {

    private static final String SCHEMA = MySqlTestContainer.get().getDatabaseName();
    private static final String SNAPSHOT = "seed_snapshot";
    private static final String HISTORY = "flyway_schema_history";
    private static List<String> seededTables;

    private DatabaseReset() {
    }

    public static synchronized void reset() {
        // 세션 설정(외래 키 검사 끄기 등)이 이어지도록 연결 하나로 처리한다.
        SingleConnectionDataSource connection = MySqlTestContainer.rootConnection();
        try {
            reset(new JdbcTemplate(connection));
        } finally {
            connection.destroy();
        }
    }

    private static void reset(final JdbcTemplate root) {
        if (seededTables == null) {
            Flyway.configure().dataSource(MySqlTestContainer.dataSource()).load().migrate();
            seededTables = snapshotSeeds(root);
            return;
        }
        root.execute("SET SESSION information_schema_stats_expiry = 0");
        root.execute("SET FOREIGN_KEY_CHECKS = 0");
        try {
            for (String table : tables(root)) {
                if (seededTables.contains(table) || touched(root, table)) {
                    root.execute("TRUNCATE TABLE `" + SCHEMA + "`.`" + table + "`");
                }
            }
            for (String table : seededTables) {
                String columns = String.join(", ", writableColumns(root, table));
                root.execute("INSERT INTO `" + SCHEMA + "`.`" + table + "` (" + columns + ") SELECT " + columns
                        + " FROM `" + SNAPSHOT + "`.`" + table + "`");
            }
        } finally {
            root.execute("SET FOREIGN_KEY_CHECKS = 1");
        }
    }

    private static List<String> snapshotSeeds(final JdbcTemplate root) {
        root.execute("DROP DATABASE IF EXISTS `" + SNAPSHOT + "`");
        root.execute("CREATE DATABASE `" + SNAPSHOT + "`");
        List<String> seeded = tables(root).stream()
                .filter(table -> Boolean.TRUE.equals(root.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM `" + SCHEMA + "`.`" + table + "`)", Boolean.class)))
                .toList();
        for (String table : seeded) {
            root.execute("CREATE TABLE `" + SNAPSHOT + "`.`" + table + "` AS SELECT * FROM `" + SCHEMA + "`.`" + table + "`");
        }
        return seeded;
    }

    private static List<String> tables(final JdbcTemplate root) {
        return root.queryForList("""
                SELECT TABLE_NAME FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME <> ?
                """, String.class, SCHEMA, HISTORY);
    }

    // 계산 열은 직접 넣을 수 없으므로 되돌릴 때 뺀다.
    private static List<String> writableColumns(final JdbcTemplate root, final String table) {
        return root.queryForList("""
                SELECT CONCAT('`', COLUMN_NAME, '`') FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND EXTRA NOT LIKE '%GENERATED%'
                ORDER BY ORDINAL_POSITION
                """, String.class, SCHEMA, table);
    }

    // 행이 남았거나, 비웠어도 자동 증가 값이 올라간 표만 비워 ID가 1부터 다시 시작하게 한다.
    private static boolean touched(final JdbcTemplate root, final String table) {
        Long autoIncrement = root.queryForObject(
                "SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
                Long.class, SCHEMA, table);
        return (autoIncrement != null && autoIncrement > 1) || Boolean.TRUE.equals(root.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM `" + SCHEMA + "`.`" + table + "`)", Boolean.class));
    }
}
