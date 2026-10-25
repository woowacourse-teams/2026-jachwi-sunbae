package com.jachwisunbae.rental.repository;

import com.jachwisunbae.rental.domain.RentalPricePoint;
import com.jachwisunbae.rental.domain.RentalSnapshot;
import java.time.LocalDate;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

// 행정동 시세 계산에 필요한 거래 금액을 읽는다. 아무것도 쓰지 않는다.
@Repository
public class JdbcAdminDongRentRepository {

    private final JdbcTemplate jdbcTemplate;

    public JdbcAdminDongRentRepository(final JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<RentalPricePoint> findPrices(final LocalDate queryStartDate, final LocalDate queryEndDate) {
        return jdbcTemplate.query("""
            SELECT legal_dong_code, monthly_rent_amount_krw, deposit_amount_krw FROM rental_transactions
            WHERE dataset_key = ? AND contract_date BETWEEN ? AND ?
            """, (rs, index) -> new RentalPricePoint(rs.getString("legal_dong_code"),
                rs.getLong("monthly_rent_amount_krw"), rs.getLong("deposit_amount_krw")),
            RentalSnapshot.DATASET_KEY, queryStartDate, queryEndDate);
    }
}
