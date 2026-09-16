package com.jachwisunbae.common.database;

import java.io.IOException;
import java.util.Arrays;
import javax.sql.DataSource;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Profile("!test")
public class DatabaseUpgradeInitializer implements ApplicationRunner {

    private static final String UPGRADE_SCRIPT_PATTERN = "classpath*:db/upgrade/*.sql";

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;
    private final PathMatchingResourcePatternResolver resourceResolver =
            new PathMatchingResourcePatternResolver();

    public DatabaseUpgradeInitializer(final DataSource dataSource, final JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(final ApplicationArguments args) throws IOException {
        createUpgradeHistory();
        Resource[] resources = resourceResolver.getResources(UPGRADE_SCRIPT_PATTERN);
        Arrays.sort(resources, (left, right) -> left.getFilename().compareTo(right.getFilename()));
        for (Resource resource : resources) {
            applyOnce(resource);
        }
    }

    private void createUpgradeHistory() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS schema_upgrade_history (
                    script_name VARCHAR(255) PRIMARY KEY,
                    applied_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """);
    }

    private void applyOnce(final Resource resource) {
        String filename = resource.getFilename();
        if (filename == null) {
            throw new IllegalStateException("업그레이드 SQL 파일 이름을 확인할 수 없습니다.");
        }
        Integer applied = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM schema_upgrade_history WHERE script_name = ?", Integer.class, filename);
        if (applied != null && applied > 0) {
            return;
        }
        new ResourceDatabasePopulator(resource).execute(dataSource);
        jdbcTemplate.update("INSERT INTO schema_upgrade_history (script_name) VALUES (?)", filename);
    }
}
