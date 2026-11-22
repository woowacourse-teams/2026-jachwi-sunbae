package com.jachwisunbae.transit.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jachwisunbae.support.MySqlTestContainer;
import com.jachwisunbae.support.ResetDatabase;
import com.jachwisunbae.transit.domain.AdminDong;
import com.jachwisunbae.transit.domain.vo.Coordinate;
import com.jachwisunbae.transit.provider.geojson.GeoJsonBoundaries;
import java.time.LocalDate;
import java.util.List;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

@ResetDatabase
class JdbcAdminDongRepositoryTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private static JdbcTemplate jdbcTemplate;
    private static JdbcAdminDongRepository repository;

    @BeforeAll
    static void setUp() {
        DataSource dataSource = MySqlTestContainer.dataSource("rewriteBatchedStatements=true");
        Flyway.configure().dataSource(dataSource).load().migrate();
        jdbcTemplate = new JdbcTemplate(dataSource);
        repository = new JdbcAdminDongRepository(jdbcTemplate, OBJECT_MAPPER);
    }

    @Test
    @DisplayName("기존 행정동을 지우고 새 행정동으로 교체하며, 경계와 중심을 그대로 다시 읽는다")
    void replacesAndReadsBack() throws Exception {
        repository.replace(List.of(adminDong("99999999", "옛동", "{\"type\":\"Polygon\",\"coordinates\":"
                + "[[[0,0],[1,0],[1,1],[0,1],[0,0]]]}")));

        repository.replace(List.of(adminDong("11010530", "사직동", "{\"type\":\"MultiPolygon\",\"coordinates\":"
                + "[[[[126.95,37.54],[126.99,37.54],[126.99,37.56],[126.95,37.56],[126.95,37.54]]]]}")));

        List<AdminDong> saved = repository.findAll();
        assertThat(saved).extracting(AdminDong::code).containsExactly("11010530");
        AdminDong sajik = saved.get(0);
        assertThat(sajik.fullName()).isEqualTo("서울특별시 종로구 사직동");
        assertThat(sajik.baseDate()).isEqualTo(LocalDate.of(2025, 6, 30));
        assertThat(sajik.contains(new Coordinate(37.55, 126.97))).isTrue();
        assertThat(jdbcTemplate.queryForObject("SELECT center_latitude FROM admin_dongs", Double.class))
                .isCloseTo(37.55, within(1e-7));
    }

    private static AdminDong adminDong(final String code, final String name, final String geometry)
            throws Exception {
        return new AdminDong(code, name, "서울특별시", "종로구", "서울특별시 종로구 " + name, LocalDate.of(2025, 6, 30),
                GeoJsonBoundaries.toBoundary(OBJECT_MAPPER.readTree(geometry)));
    }
}
