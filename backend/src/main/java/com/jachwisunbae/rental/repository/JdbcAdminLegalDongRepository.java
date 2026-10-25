package com.jachwisunbae.rental.repository;

import com.jachwisunbae.rental.domain.AdminLegalDong;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

// 행정동과 관할 법정동의 연결을 전체 교체하고 읽는다.
@Repository
public class JdbcAdminLegalDongRepository {

    private final JdbcTemplate jdbcTemplate;

    public JdbcAdminLegalDongRepository(final JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void replace(final List<AdminLegalDong> links) {
        jdbcTemplate.update("DELETE FROM admin_legal_dongs");
        jdbcTemplate.batchUpdate("""
            INSERT INTO admin_legal_dongs (admin_dong_code, legal_dong_code, legal_dong_name) VALUES (?, ?, ?)
            """, links, 1000, (statement, link) -> {
                statement.setString(1, link.adminDongCode());
                statement.setString(2, link.legalDongCode());
                statement.setString(3, link.legalDongName());
            });
    }

    public List<AdminLegalDong> findAll() {
        return jdbcTemplate.query("SELECT admin_dong_code, legal_dong_code, legal_dong_name FROM admin_legal_dongs",
            (rs, index) -> new AdminLegalDong(rs.getString("admin_dong_code"), rs.getString("legal_dong_code"),
                rs.getString("legal_dong_name")));
    }
}
