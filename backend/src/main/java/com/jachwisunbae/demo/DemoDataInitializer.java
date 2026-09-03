package com.jachwisunbae.demo;

import com.jachwisunbae.property.type.RoomOption;
import com.jachwisunbae.property.type.UtilityOption;
import java.sql.Date;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "demo.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DemoDataInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;
    private final String demoNickname;

    public DemoDataInitializer(JdbcTemplate jdbcTemplate, Clock clock,
                               @Value("${demo.seed.nickname:이자취}") String demoNickname) {
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
        this.demoNickname = demoNickname;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        LocalDateTime now = LocalDateTime.now(clock);

        // 비밀번호 없는 데모 닉네임을 멱등하게 만든다(PD-024). nickname UNIQUE라 재실행해도 중복 생성되지 않는다.
        jdbcTemplate.update("INSERT INTO members (nickname, password_hash, created_at, updated_at) "
                        + "VALUES (?, NULL, ?, ?) ON DUPLICATE KEY UPDATE nickname = VALUES(nickname)",
                demoNickname, now, now);
        Long memberId = jdbcTemplate.queryForObject(
                "SELECT id FROM members WHERE nickname = ?", Long.class, demoNickname);
        if (memberId == null || count("properties", "member_id", memberId) > 0) {
            return;
        }

        long firstPropertyId = insertProperty(memberId, "신림역 원룸", 10_000_000L, 550_000L,
                "서울 관악구 신림로 12길 3", "37.4841234", "126.9291234", now.minusHours(1));
        insertPropertyDetails(firstPropertyId, "zigbang.com/oneroom/12345",
                now.toLocalDate().plusMonths(1), 70_000L, now.plusDays(3),
                List.of(RoomOption.AIR_CONDITIONER, RoomOption.REFRIGERATOR,
                        RoomOption.WASHING_MACHINE, RoomOption.INDUCTION),
                List.of(UtilityOption.WATER), now);
        initializeMemo(firstPropertyId, now);
        initializeChecklists(memberId, firstPropertyId, now);

        long secondPropertyId = insertProperty(memberId, "망원동 투룸", 30_000_000L, 750_000L,
                "서울 마포구 망원로 14길 22", "37.5562140", "126.9017210", now.minusHours(3));
        insertPropertyDetails(secondPropertyId, "드림공인중개사 010-9977-9012",
                null, 0L, null, List.of(), List.of(), now);
    }

    private long insertProperty(long memberId, String name, long deposit, long rent,
                                String address, String latitude, String longitude,
                                LocalDateTime createdAt) {
        jdbcTemplate.update("INSERT INTO properties (member_id, name, deposit_amount, monthly_rent_amount, "
                        + "address, latitude, longitude, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                memberId, name, deposit, rent, address, latitude, longitude, createdAt);
        return jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    }

    private void insertPropertyDetails(long propertyId, String discoverySource,
                                       LocalDate availableMoveInDate, long maintenanceFeeAmount,
                                       LocalDateTime visitScheduledAt, List<RoomOption> roomOptions,
                                       List<UtilityOption> utilityOptions, LocalDateTime now) {
        jdbcTemplate.update("INSERT INTO property_details (property_id, available_move_in_date, "
                        + "maintenance_fee_amount, visit_scheduled_at, discovery_source, created_at) "
                        + "VALUES (?, ?, ?, ?, ?, ?)",
                propertyId, toSqlDate(availableMoveInDate), maintenanceFeeAmount, visitScheduledAt,
                discoverySource, now);
        for (RoomOption option : roomOptions) {
            jdbcTemplate.update(
                    "INSERT INTO property_room_options (property_id, option_code) VALUES (?, ?)",
                    propertyId, option.name());
        }
        for (UtilityOption utility : utilityOptions) {
            jdbcTemplate.update(
                    "INSERT INTO property_utility_options (property_id, utility_code) VALUES (?, ?)",
                    propertyId, utility.name());
        }
    }

    private void initializeMemo(long propertyId, LocalDateTime now) {
        jdbcTemplate.update("INSERT INTO property_memos (property_id, free_memo, created_at) VALUES (?, ?, ?)",
                propertyId, "채광이 좋고 역에서 가깝다. 계약 전에 등기부등본을 다시 확인하기.", now);
    }

    private void initializeChecklists(long memberId, long propertyId, LocalDateTime now) {
        for (String stage : List.of("ON_SITE", "PRE_CONTRACT")) {
            String name = "ON_SITE".equals(stage) ? "나의 원룸 체크리스트" : "계약 전 필수 체크리스트";
            jdbcTemplate.update(
                    "INSERT INTO user_checklists (member_id, name, stage, created_at) VALUES (?, ?, ?, ?)",
                    memberId, name, stage, now);
            Long checklistId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            List<Long> itemIds = jdbcTemplate.queryForList(
                    "SELECT id FROM system_check_items WHERE stage = ? AND deleted_at IS NULL ORDER BY id",
                    Long.class, stage);
            for (int index = 0; index < itemIds.size(); index++) {
                jdbcTemplate.update("INSERT INTO user_checklist_items "
                                + "(user_checklist_id, system_check_item_id, display_order) VALUES (?, ?, ?)",
                        checklistId, itemIds.get(index), index + 1);
            }
            jdbcTemplate.update("INSERT INTO property_checklists "
                            + "(property_id, user_checklist_id, checklist_name, stage, created_at, updated_at) "
                            + "VALUES (?, ?, ?, ?, ?, ?)",
                    propertyId, checklistId, name, stage, now, now);
            Long propertyChecklistId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            for (int index = 0; index < itemIds.size(); index++) {
                String status = index == 0 ? "GOOD" : index == 1 ? "CAUTION" : "UNCONFIRMED";
                String memo = index == 1 && "ON_SITE".equals(stage) ? "아침에는 수압이 조금 약하다고 함" : "";
                jdbcTemplate.update("INSERT INTO property_checklist_items "
                                + "(property_checklist_id, system_check_item_id, display_order, status, memo, "
                                + "question, created_at) "
                                + "SELECT ?, id, ?, ?, ?, question, ? FROM system_check_items WHERE id = ?",
                        propertyChecklistId, index + 1, status, memo, now, itemIds.get(index));
            }
        }
    }

    private Date toSqlDate(LocalDate date) {
        return date == null ? null : Date.valueOf(date);
    }

    private int count(String table, String column, long value) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + table + " WHERE " + column + " = ?", Integer.class, value);
        return count == null ? 0 : count;
    }
}
