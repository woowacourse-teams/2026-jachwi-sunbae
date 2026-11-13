package com.jachwisunbae.rental.importer;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.JdbcTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

// DDL은 MySQL에서 바로 커밋되므로 테스트 트랜잭션 없이 실행하고, 바꾼 스키마는 테스트마다 되돌린다.
@Testcontainers
@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class RentalSchemaValidatorTest {

    @Container
    @ServiceConnection
    private static final MySQLContainer<?> mysqlContainer = new MySQLContainer<>("mysql:8.4.10");

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RentalSchemaValidator validator = new RentalSchemaValidator();

    @AfterEach
    void restoreSchema() {
        if (exists("legal_dongs_renamed")) {
            jdbcTemplate.execute("RENAME TABLE legal_dongs_renamed TO legal_dongs");
        }
        if (columnExists("rental_transactions", "floor_renamed")) {
            jdbcTemplate.execute("ALTER TABLE rental_transactions RENAME COLUMN floor_renamed TO floor");
        }
    }

    @Test
    @DisplayName("마이그레이션한 스키마는 통과한다")
    void acceptsMigratedSchema() {
        // when // then
        assertThatCode(() -> validator.validate(jdbcTemplate)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("적재 테이블이 없으면 거부한다")
    void rejectsMissingTable() {
        // given
        jdbcTemplate.execute("RENAME TABLE legal_dongs TO legal_dongs_renamed");

        // when // then
        assertThatThrownBy(() -> validator.validate(jdbcTemplate))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("InnoDB 테이블이 준비되지 않았습니다");
    }

    @Test
    @DisplayName("필수 컬럼이 없으면 테이블 이름을 담아 거부한다")
    void rejectsMissingColumn() {
        // given
        jdbcTemplate.execute("ALTER TABLE rental_transactions RENAME COLUMN floor TO floor_renamed");

        // when // then
        assertThatThrownBy(() -> validator.validate(jdbcTemplate))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("rental_transactions");
    }

    private boolean exists(final String table) {
        return jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
                """, Integer.class, table) > 0;
    }

    private boolean columnExists(final String table, final String column) {
        return jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
                """, Integer.class, table, column) > 0;
    }
}
