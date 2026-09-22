package com.jachwisunbae.common.database;

import static org.assertj.core.api.Assertions.assertThat;

import com.jachwisunbae.demo.DemoDataInitializer;
import com.jachwisunbae.member.entity.Member;
import com.jachwisunbae.member.repository.JdbcMemberRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
class DatabaseBaselineIntegrationTest {

    @Container
    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4.10");

    private static DataSource dataSource;
    private static JdbcTemplate jdbcTemplate;

    @BeforeAll
    static void setUp() {
        dataSource = new DriverManagerDataSource(
                MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword());
        jdbcTemplate = new JdbcTemplate(dataSource);
    }

    @Test
    void initScriptsCreateTheCompleteRuntimeSchemaWithoutDeletingUserData() throws Exception {
        execute("db/init/001-schema.sql");
        execute("db/init/002-seed.sql");

        assertThat(tableExists("property_comparison_view_events")).isTrue();
        assertThat(tableExists("nickname_credentials")).isFalse();
        assertThat(tableExists("schema_upgrade_history")).isFalse();
        assertThat(columnExists("members", "first_property_created_at")).isFalse();

        JdbcMemberRepository memberRepository = new JdbcMemberRepository(jdbcTemplate);
        LocalDateTime now = LocalDateTime.parse("2026-09-22T00:00:00");
        Member savedMember = memberRepository.save(Member.create("새회원", null, now));
        assertThat(memberRepository.findByNickname("새회원"))
                .get()
                .extracting(Member::getId)
                .isEqualTo(savedMember.getId());

        jdbcTemplate.update("""
                INSERT INTO members (id, nickname, nickname_key, password_hash, created_at, updated_at)
                VALUES (999, '기준선 사용자', '기준선 사용자', NULL, NOW(6), NOW(6))
                """);
        jdbcTemplate.update("""
                INSERT INTO user_checklists (id, member_id, name, stage, created_at)
                VALUES (999, 999, '보존할 체크리스트', 'ON_SITE', NOW(6))
                """);

        execute("db/init/002-seed.sql");

        assertThat(count("SELECT COUNT(*) FROM user_checklists WHERE id = 999")).isOne();

        DemoDataInitializer initializer = new DemoDataInitializer(
                jdbcTemplate,
                Clock.fixed(Instant.parse("2026-09-22T00:00:00Z"), ZoneOffset.UTC),
                "이자취"
        );
        new TransactionTemplate(new DataSourceTransactionManager(dataSource))
                .executeWithoutResult(status -> initializer.run(null));

        assertThat(count("SELECT COUNT(*) FROM members WHERE nickname = '이자취'")).isOne();
        assertThat(count("SELECT COUNT(*) FROM properties WHERE member_id = "
                + "(SELECT id FROM members WHERE nickname = '이자취')")).isEqualTo(2);
    }

    private void execute(String path) {
        new ResourceDatabasePopulator(new ClassPathResource(path)).execute(dataSource);
    }

    private boolean tableExists(String tableName) {
        return count("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() "
                + "AND table_name = '" + tableName + "'") == 1;
    }

    private boolean columnExists(String tableName, String columnName) {
        return count("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() "
                + "AND table_name = '" + tableName + "' AND column_name = '" + columnName + "'") == 1;
    }

    private int count(String sql) {
        Integer result = jdbcTemplate.queryForObject(sql, Integer.class);
        return result == null ? 0 : result;
    }
}
