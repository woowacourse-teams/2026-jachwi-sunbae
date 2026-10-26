package com.jachwisunbae.rental.repository;

import com.jachwisunbae.rental.domain.AdminDongRent;
import com.jachwisunbae.rental.domain.AdminDongRents;
import com.jachwisunbae.rental.domain.AdminLegalDong;
import com.jachwisunbae.rental.domain.RentalSnapshot;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

// 행정동과 관할 법정동의 연결, 시세 계산에 쓸 거래, 행정동별 월세 시세를 읽고 쓴다.
@Repository
public class JdbcAdminDongRentRepository {

    private final JdbcTemplate jdbcTemplate;

    public JdbcAdminDongRentRepository(final JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void replaceLinks(final List<AdminLegalDong> links) {
        jdbcTemplate.update("DELETE FROM admin_legal_dongs");
        jdbcTemplate.batchUpdate("""
            INSERT INTO admin_legal_dongs (admin_dong_code, legal_dong_code, legal_dong_name) VALUES (?, ?, ?)
            """, links, 1000, (statement, link) -> {
                statement.setString(1, link.adminDongCode());
                statement.setString(2, link.legalDongCode());
                statement.setString(3, link.legalDongName());
            });
    }

    public Optional<LocalDate> findRentEndDate() {
        return jdbcTemplate.queryForList("""
            SELECT contract_to FROM rental_datasets WHERE dataset_key = ? AND transaction_sha256 IS NOT NULL
            """, LocalDate.class, RentalSnapshot.DATASET_KEY).stream().findFirst();
    }

    public List<AdminDongRents.Deal> findDeals(final LocalDate startDate, final LocalDate endDate) {
        return jdbcTemplate.query("""
            SELECT l.admin_dong_code, l.legal_dong_name, t.monthly_rent_amount_krw, t.deposit_amount_krw
            FROM admin_legal_dongs l
            JOIN rental_transactions t ON t.legal_dong_code = l.legal_dong_code
            WHERE t.dataset_key = ? AND t.contract_date BETWEEN ? AND ?
            """, (rs, index) -> new AdminDongRents.Deal(rs.getString("admin_dong_code"), rs.getString("legal_dong_name"),
                rs.getLong("monthly_rent_amount_krw"), rs.getLong("deposit_amount_krw")),
            RentalSnapshot.DATASET_KEY, startDate, endDate);
    }

    public void deleteRents() {
        jdbcTemplate.update("DELETE FROM admin_dong_rents");
    }

    public void saveRents(final List<AdminDongRent> rents, final LocalDate startDate, final LocalDate endDate) {
        jdbcTemplate.batchUpdate("""
            INSERT INTO admin_dong_rents (admin_dong_code, legal_dong_names, monthly_rent_krw, deposit_krw,
                transaction_count, rent_start_date, rent_end_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, rents, 1000, (statement, rent) -> {
                statement.setString(1, rent.adminDongCode());
                statement.setString(2, String.join(",", rent.legalDongNames()));
                statement.setLong(3, rent.monthlyRentKrw());
                statement.setLong(4, rent.depositKrw());
                statement.setInt(5, rent.transactionCount());
                statement.setObject(6, startDate);
                statement.setObject(7, endDate);
            });
    }

    public AdminDongRents findAll() {
        Map<String, AdminDongRent> byAdminDong = new HashMap<>();
        LocalDate[] period = new LocalDate[2];
        jdbcTemplate.query("SELECT * FROM admin_dong_rents", rs -> {
            AdminDongRent rent = new AdminDongRent(rs.getString("admin_dong_code"),
                Arrays.asList(rs.getString("legal_dong_names").split(",")), rs.getLong("monthly_rent_krw"),
                rs.getLong("deposit_krw"), rs.getInt("transaction_count"));
            byAdminDong.put(rent.adminDongCode(), rent);
            period[0] = rs.getDate("rent_start_date").toLocalDate();
            period[1] = rs.getDate("rent_end_date").toLocalDate();
        });
        if (byAdminDong.isEmpty()) {
            return AdminDongRents.empty();
        }
        return new AdminDongRents(period[0], period[1], byAdminDong);
    }
}
