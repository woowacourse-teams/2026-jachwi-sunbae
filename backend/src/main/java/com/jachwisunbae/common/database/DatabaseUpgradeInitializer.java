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
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Profile("!test")
public class DatabaseUpgradeInitializer implements ApplicationRunner {

    private static final String UPGRADE_SCRIPT_PATTERN = "classpath*:db/upgrade/*.sql";

    private final DataSource dataSource;
    private final PathMatchingResourcePatternResolver resourceResolver =
            new PathMatchingResourcePatternResolver();

    public DatabaseUpgradeInitializer(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws IOException {
        Resource[] resources = resourceResolver.getResources(UPGRADE_SCRIPT_PATTERN);
        Arrays.sort(resources, (left, right) -> left.getFilename().compareTo(right.getFilename()));
        if (resources.length == 0) {
            return;
        }
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator(resources);
        populator.execute(dataSource);
    }
}
