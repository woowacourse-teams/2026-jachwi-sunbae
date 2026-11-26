package com.jachwisunbae.support;

import javax.sql.DataSource;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.testcontainers.containers.MySQLContainer;

// 모든 DB 테스트가 MySQL 컨테이너 하나를 함께 쓴다. 처음 쓰일 때 한 번 띄우고 JVM이 끝나면 Testcontainers가 정리한다.
public final class MySqlTestContainer {

    private static final MySQLContainer<?> CONTAINER = new MySQLContainer<>("mysql:8.4.10");

    static {
        CONTAINER.start();
    }

    private MySqlTestContainer() {
    }

    public static MySQLContainer<?> get() {
        return CONTAINER;
    }

    public static String jdbcUrl() {
        return CONTAINER.getJdbcUrl();
    }

    public static String jdbcUrl(final String database, final String parameters) {
        String url = "jdbc:mysql://" + CONTAINER.getHost() + ":" + CONTAINER.getMappedPort(3306) + "/" + database;
        return parameters.isEmpty() ? url : url + "?" + parameters;
    }

    public static DataSource dataSource() {
        return new DriverManagerDataSource(CONTAINER.getJdbcUrl(), CONTAINER.getUsername(), CONTAINER.getPassword());
    }

    public static DataSource dataSource(final String parameters) {
        return new DriverManagerDataSource(jdbcUrl(CONTAINER.getDatabaseName(), parameters),
                CONTAINER.getUsername(), CONTAINER.getPassword());
    }

    public static SingleConnectionDataSource rootConnection() {
        return new SingleConnectionDataSource(CONTAINER.getJdbcUrl(), "root", CONTAINER.getPassword(), true);
    }
}
