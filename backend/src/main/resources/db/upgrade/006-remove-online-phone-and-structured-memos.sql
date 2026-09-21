-- 0. member_checklist_preferences는 통합 스키마에서 새로 추가된 테이블이라 리팩터링 이전
--    볼륨·RDS에는 없다. 이 스크립트의 DELETE·ALTER 대상이므로 먼저 존재를 보장한다.
CREATE TABLE IF NOT EXISTS member_checklist_preferences (
    member_id BIGINT NOT NULL,
    stage VARCHAR(30) NOT NULL,
    user_checklist_id BIGINT UNSIGNED NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (member_id, stage),
    CONSTRAINT fk_member_pref_member FOREIGN KEY (member_id) REFERENCES members (id),
    CONSTRAINT fk_member_pref_checklist FOREIGN KEY (user_checklist_id) REFERENCES user_checklists (id),
    CONSTRAINT chk_member_pref_stage CHECK (stage IN ('ON_SITE', 'PRE_CONTRACT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 1. ONLINE_PHONE 데이터는 현재 enum에서 제거됐지만 운영 데이터는 보관 테이블에 남긴다.
CREATE TABLE IF NOT EXISTS legacy_online_phone_member_checklist_preferences LIKE member_checklist_preferences;
INSERT IGNORE INTO legacy_online_phone_member_checklist_preferences
SELECT mcp.*
FROM member_checklist_preferences mcp
LEFT JOIN user_checklists uc ON uc.id = mcp.user_checklist_id
WHERE mcp.stage = 'ONLINE_PHONE' OR uc.stage = 'ONLINE_PHONE';

CREATE TABLE IF NOT EXISTS legacy_online_phone_system_check_items LIKE system_check_items;
INSERT IGNORE INTO legacy_online_phone_system_check_items
SELECT * FROM system_check_items WHERE stage = 'ONLINE_PHONE';

CREATE TABLE IF NOT EXISTS legacy_online_phone_user_checklists LIKE user_checklists;
INSERT IGNORE INTO legacy_online_phone_user_checklists
SELECT * FROM user_checklists WHERE stage = 'ONLINE_PHONE';

CREATE TABLE IF NOT EXISTS legacy_online_phone_user_checklist_items LIKE user_checklist_items;
INSERT IGNORE INTO legacy_online_phone_user_checklist_items
SELECT uci.*
FROM user_checklist_items uci
JOIN user_checklists uc ON uc.id = uci.user_checklist_id
LEFT JOIN system_check_items sci ON sci.id = uci.system_check_item_id
-- 이전 스키마에는 체크리스트 단계와 시스템 항목 단계를 일치시키는 제약이 없었다.
-- 따라서 이후 삭제 대상인 ONLINE_PHONE 시스템 항목을 참조하는 교차 단계 행도 함께 보관한다.
WHERE uc.stage = 'ONLINE_PHONE' OR sci.stage = 'ONLINE_PHONE';

CREATE TABLE IF NOT EXISTS legacy_online_phone_property_checklists LIKE property_checklists;
INSERT IGNORE INTO legacy_online_phone_property_checklists
SELECT pc.*
FROM property_checklists pc
LEFT JOIN user_checklists uc ON uc.id = pc.user_checklist_id
WHERE pc.stage = 'ONLINE_PHONE' OR uc.stage = 'ONLINE_PHONE';

CREATE TABLE IF NOT EXISTS legacy_online_phone_property_checklist_items LIKE property_checklist_items;
INSERT IGNORE INTO legacy_online_phone_property_checklist_items
SELECT pci.*
FROM property_checklist_items pci
JOIN property_checklists pc ON pc.id = pci.property_checklist_id
LEFT JOIN system_check_items sci ON sci.id = pci.system_check_item_id
WHERE pc.stage = 'ONLINE_PHONE' OR sci.stage = 'ONLINE_PHONE';

DELETE mcp
FROM member_checklist_preferences mcp
LEFT JOIN user_checklists uc ON uc.id = mcp.user_checklist_id
WHERE mcp.stage = 'ONLINE_PHONE' OR uc.stage = 'ONLINE_PHONE';

DELETE FROM property_checklist_items
WHERE property_checklist_id IN (
    SELECT id FROM property_checklists WHERE stage = 'ONLINE_PHONE'
);
DELETE FROM property_checklists WHERE stage = 'ONLINE_PHONE';

UPDATE property_checklists pc
JOIN user_checklists uc ON uc.id = pc.user_checklist_id
SET pc.user_checklist_id = NULL
WHERE uc.stage = 'ONLINE_PHONE';

DELETE FROM user_checklist_items
WHERE user_checklist_id IN (
    SELECT id FROM user_checklists WHERE stage = 'ONLINE_PHONE'
);
DELETE FROM user_checklists WHERE stage = 'ONLINE_PHONE';

DELETE FROM property_checklist_items
WHERE system_check_item_id IN (
    SELECT id FROM system_check_items WHERE stage = 'ONLINE_PHONE'
);
DELETE FROM user_checklist_items
WHERE system_check_item_id IN (
    SELECT id FROM system_check_items WHERE stage = 'ONLINE_PHONE'
);
DELETE FROM system_check_items WHERE stage = 'ONLINE_PHONE';


-- 2. 구조화 메모는 자유 메모에 사람이 읽을 수 있는 형태로 합치고 원본도 보관한다.
SET @archive_structured_memos = IF(
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'property_memo_items'),
    'CREATE TABLE IF NOT EXISTS legacy_property_memo_items LIKE property_memo_items',
    'SELECT 1'
);
PREPARE stmt FROM @archive_structured_memos; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @copy_structured_memos = IF(
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'property_memo_items'),
    'INSERT IGNORE INTO legacy_property_memo_items SELECT * FROM property_memo_items',
    'SELECT 1'
);
PREPARE stmt FROM @copy_structured_memos; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @merge_structured_memos = IF(
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'property_memo_items'),
    "UPDATE property_memos pm JOIN (SELECT property_memo_id, GROUP_CONCAT(CONCAT(label, ': ', content) ORDER BY display_order, id SEPARATOR '\n') AS structured_text FROM property_memo_items WHERE content <> '' GROUP BY property_memo_id) legacy ON legacy.property_memo_id = pm.id SET pm.free_memo = LEFT(CONCAT(pm.free_memo, IF(pm.free_memo = '', '', '\n'), '[이전 구조화 메모]\n', legacy.structured_text), 2000) WHERE pm.free_memo NOT LIKE '%[이전 구조화 메모]%'",
    'SELECT 1'
);
PREPARE stmt FROM @merge_structured_memos; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @archive_system_memos = IF(
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'system_memo_items'),
    'CREATE TABLE IF NOT EXISTS legacy_system_memo_items LIKE system_memo_items',
    'SELECT 1'
);
PREPARE stmt FROM @archive_system_memos; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @copy_system_memos = IF(
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'system_memo_items'),
    'INSERT IGNORE INTO legacy_system_memo_items SELECT * FROM system_memo_items',
    'SELECT 1'
);
PREPARE stmt FROM @copy_system_memos; EXECUTE stmt; DEALLOCATE PREPARE stmt;

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
