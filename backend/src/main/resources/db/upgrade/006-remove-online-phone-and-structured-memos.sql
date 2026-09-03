-- 0. member_checklist_preferences는 통합 스키마에서 새로 추가된 테이블이라 리팩터링 이전
--    볼륨·RDS에는 없다. 이 스크립트의 DELETE·ALTER 대상이므로 먼저 존재를 보장한다.
CREATE TABLE IF NOT EXISTS member_checklist_preferences (
    member_id BIGINT UNSIGNED NOT NULL,
    stage VARCHAR(30) NOT NULL,
    user_checklist_id BIGINT UNSIGNED NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (member_id, stage),
    CONSTRAINT fk_member_pref_member FOREIGN KEY (member_id) REFERENCES members (id),
    CONSTRAINT fk_member_pref_checklist FOREIGN KEY (user_checklist_id) REFERENCES user_checklists (id),
    CONSTRAINT chk_member_pref_stage CHECK (stage IN ('ON_SITE', 'PRE_CONTRACT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 1. ONLINE_PHONE 데이터 삭제 (명세 13.3: ONLINE_PHONE은 다른 단계로 매핑하지 않고 비노출 후 제거)
DELETE FROM property_checklist_items
WHERE property_checklist_id IN (
    SELECT id FROM property_checklists WHERE stage = 'ONLINE_PHONE'
);

DELETE FROM property_checklists WHERE stage = 'ONLINE_PHONE';

DELETE FROM user_checklist_items
WHERE user_checklist_id IN (
    SELECT id FROM user_checklists WHERE stage = 'ONLINE_PHONE'
);

DELETE FROM user_checklists WHERE stage = 'ONLINE_PHONE';

DELETE FROM member_checklist_preferences WHERE stage = 'ONLINE_PHONE';

DELETE FROM system_check_items WHERE stage = 'ONLINE_PHONE';


-- 2. 구조화 메모(system_memo_items, property_memo_items) 데이터 및 테이블 폐기
DROP TABLE IF EXISTS property_memo_items;
DROP TABLE IF EXISTS system_memo_items;


-- 3. CHECK 제약 조건 2단계(ON_SITE, PRE_CONTRACT)로 축소 갱신
-- MySQL 8.4는 DROP CONSTRAINT/DROP CHECK에 IF EXISTS를 지원하지 않으므로
-- information_schema로 존재를 먼저 확인한 뒤 동적 SQL로 삭제한다.

-- 3-1. system_check_items
SET @drop_chk_system_check_items_stage = (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_schema = DATABASE()
              AND table_name = 'system_check_items'
              AND constraint_name = 'chk_system_check_items_stage'
        ),
        'ALTER TABLE system_check_items DROP CHECK chk_system_check_items_stage',
        'SELECT 1'
    )
);
PREPARE drop_chk_system_check_items_stage_stmt FROM @drop_chk_system_check_items_stage;
EXECUTE drop_chk_system_check_items_stage_stmt;
DEALLOCATE PREPARE drop_chk_system_check_items_stage_stmt;

ALTER TABLE system_check_items ADD CONSTRAINT chk_system_check_items_stage
    CHECK (stage IN ('ON_SITE', 'PRE_CONTRACT'));

-- 3-2. user_checklists
SET @drop_chk_user_checklists_stage = (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_schema = DATABASE()
              AND table_name = 'user_checklists'
              AND constraint_name = 'chk_user_checklists_stage'
        ),
        'ALTER TABLE user_checklists DROP CHECK chk_user_checklists_stage',
        'SELECT 1'
    )
);
PREPARE drop_chk_user_checklists_stage_stmt FROM @drop_chk_user_checklists_stage;
EXECUTE drop_chk_user_checklists_stage_stmt;
DEALLOCATE PREPARE drop_chk_user_checklists_stage_stmt;

ALTER TABLE user_checklists ADD CONSTRAINT chk_user_checklists_stage
    CHECK (stage IN ('ON_SITE', 'PRE_CONTRACT'));

-- 3-3. member_checklist_preferences
SET @drop_chk_member_pref_stage = (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_schema = DATABASE()
              AND table_name = 'member_checklist_preferences'
              AND constraint_name = 'chk_member_pref_stage'
        ),
        'ALTER TABLE member_checklist_preferences DROP CHECK chk_member_pref_stage',
        'SELECT 1'
    )
);
PREPARE drop_chk_member_pref_stage_stmt FROM @drop_chk_member_pref_stage;
EXECUTE drop_chk_member_pref_stage_stmt;
DEALLOCATE PREPARE drop_chk_member_pref_stage_stmt;

ALTER TABLE member_checklist_preferences ADD CONSTRAINT chk_member_pref_stage
    CHECK (stage IN ('ON_SITE', 'PRE_CONTRACT'));

-- 3-4. property_checklists
SET @drop_chk_property_checklists_stage = (
    SELECT IF(
        EXISTS(
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_schema = DATABASE()
              AND table_name = 'property_checklists'
              AND constraint_name = 'chk_property_checklists_stage'
        ),
        'ALTER TABLE property_checklists DROP CHECK chk_property_checklists_stage',
        'SELECT 1'
    )
);
PREPARE drop_chk_property_checklists_stage_stmt FROM @drop_chk_property_checklists_stage;
EXECUTE drop_chk_property_checklists_stage_stmt;
DEALLOCATE PREPARE drop_chk_property_checklists_stage_stmt;

ALTER TABLE property_checklists ADD CONSTRAINT chk_property_checklists_stage
    CHECK (stage IN ('ON_SITE', 'PRE_CONTRACT'));
