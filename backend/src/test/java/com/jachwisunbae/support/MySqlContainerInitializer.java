package com.jachwisunbae.support;

import java.util.Map;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.MapPropertySource;
import org.testcontainers.containers.MySQLContainer;

// 모든 테스트 컨텍스트가 같은 클래스로 접속 정보를 받으므로 컨텍스트 캐시 키가 갈라지지 않는다.
// 시간대 옵션은 운영·로컬 접속 URL과 같게 두어 JVM 시간대와 관계없이 UTC로 읽고 쓴다.
public class MySqlContainerInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    private static final String TIME_ZONE_PARAMETERS =
            "connectionTimeZone=%2B00:00&forceConnectionTimeZoneToSession=true&preserveInstants=true";

    @Override
    public void initialize(final ConfigurableApplicationContext context) {
        MySQLContainer<?> mysql = MySqlTestContainer.get();
        context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("sharedMySqlContainer", Map.of(
                "spring.datasource.url", MySqlTestContainer.jdbcUrl(mysql.getDatabaseName(), TIME_ZONE_PARAMETERS),
                "spring.datasource.username", mysql.getUsername(),
                "spring.datasource.password", mysql.getPassword())));
    }
}
