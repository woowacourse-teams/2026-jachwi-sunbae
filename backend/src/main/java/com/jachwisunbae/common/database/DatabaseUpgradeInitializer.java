package com.jachwisunbae.common.database;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Arrays;
import javax.sql.DataSource;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Profile("!test")
public class DatabaseUpgradeInitializer implements ApplicationRunner {

    private static final String UPGRADE_SCRIPT_PATTERN = "classpath*:db/upgrade/*.sql";
    private static final String UPGRADE_LOCK_NAME = "jachwi-sunbae-schema-upgrade";
    private static final int UPGRADE_LOCK_TIMEOUT_SECONDS = 300;

    private final DataSource dataSource;
    private final PathMatchingResourcePatternResolver resourceResolver =
            new PathMatchingResourcePatternResolver();

    public DatabaseUpgradeInitializer(final DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(final ApplicationArguments args) throws IOException {
        try (Connection connection = dataSource.getConnection()) {
            if (!acquireUpgradeLock(connection)) {
                throw new IllegalStateException("데이터베이스 업그레이드 잠금을 획득하지 못했습니다.");
            }
            try {
                createUpgradeHistory(connection);
                Resource[] resources = resourceResolver.getResources(UPGRADE_SCRIPT_PATTERN);
                Arrays.sort(resources, (left, right) -> left.getFilename().compareTo(right.getFilename()));
                for (Resource resource : resources) {
                    applyOnce(connection, resource);
                }
                LegacyMemberNicknameUpgrade.apply(connection);
            } finally {
                releaseUpgradeLock(connection);
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("데이터베이스 업그레이드 실행 중 오류가 발생했습니다.", exception);
        }
    }

    private boolean acquireUpgradeLock(final Connection connection) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("SELECT GET_LOCK(?, ?)")) {
            statement.setString(1, UPGRADE_LOCK_NAME);
            statement.setInt(2, UPGRADE_LOCK_TIMEOUT_SECONDS);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() && resultSet.getInt(1) == 1;
            }
        }
    }

    private void releaseUpgradeLock(final Connection connection) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("SELECT RELEASE_LOCK(?)")) {
            statement.setString(1, UPGRADE_LOCK_NAME);
            statement.executeQuery();
        }
    }

    private void createUpgradeHistory(final Connection connection) throws SQLException {
        try (Statement statement = connection.createStatement()) {
            statement.executeUpdate("""
                CREATE TABLE IF NOT EXISTS schema_upgrade_history (
                    script_name VARCHAR(255) PRIMARY KEY,
                    applied_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """);
        }
    }

    private void applyOnce(final Connection connection, final Resource resource) throws SQLException {
        String filename = resource.getFilename();
        if (filename == null) {
            throw new IllegalStateException("업그레이드 SQL 파일 이름을 확인할 수 없습니다.");
        }
        if (isApplied(connection, filename)) {
            return;
        }
        new ResourceDatabasePopulator(resource).populate(connection);
        recordApplied(connection, filename);
    }

    private boolean isApplied(final Connection connection, final String filename) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT COUNT(*) FROM schema_upgrade_history WHERE script_name = ?")) {
            statement.setString(1, filename);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() && resultSet.getInt(1) > 0;
            }
        }
    }

    private void recordApplied(final Connection connection, final String scriptName) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "INSERT INTO schema_upgrade_history (script_name) VALUES (?)")) {
            statement.setString(1, scriptName);
            statement.executeUpdate();
        }
    }

}
