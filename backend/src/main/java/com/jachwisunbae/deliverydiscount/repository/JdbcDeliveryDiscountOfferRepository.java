package com.jachwisunbae.deliverydiscount.repository;

import com.jachwisunbae.deliverydiscount.domain.DeliveryDiscountOffer;
import com.jachwisunbae.deliverydiscount.domain.DeliveryPlatform;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

// 운영자가 SQL로 등록한 배달 할인정보를 조회한다.
@Repository
public class JdbcDeliveryDiscountOfferRepository {

    private final JdbcTemplate jdbcTemplate;

    public JdbcDeliveryDiscountOfferRepository(final JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // 오늘 날짜를 DB 함수 대신 파라미터로 받아 DB 세션 시간대와 관계없이 같은 결과를 낸다.
    // 시작일·종료일 당일을 포함하고, 모르는 날짜(NULL)는 해당 조건을 검사하지 않는다.
    public List<DeliveryDiscountOffer> findAvailableOn(final LocalDate date) {
        return jdbcTemplate.query("""
                SELECT id, platform, brand_name, discount_amount, min_order_amount, start_date, end_date,
                       conditions, last_verified_at
                FROM delivery_discount_offers
                WHERE is_active = TRUE
                  AND (start_date IS NULL OR start_date <= ?)
                  AND (end_date IS NULL OR end_date >= ?)
                ORDER BY id
                """, (row, rowNumber) -> new DeliveryDiscountOffer(
                row.getLong("id"),
                DeliveryPlatform.valueOf(row.getString("platform")),
                row.getString("brand_name"),
                row.getInt("discount_amount"),
                row.getObject("min_order_amount", Integer.class),
                row.getObject("start_date", LocalDate.class),
                row.getObject("end_date", LocalDate.class),
                row.getString("conditions"),
                row.getObject("last_verified_at", LocalDateTime.class)), date, date);
    }
}
