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
-- (MySQL/MariaDB 호환을 위해 기존 제약조건 삭제 후 재등록)

-- 3-1. system_check_items
ALTER TABLE system_check_items DROP CONSTRAINT IF EXISTS chk_system_check_items_stage;
ALTER TABLE system_check_items ADD CONSTRAINT chk_system_check_items_stage
    CHECK (stage IN ('ON_SITE', 'PRE_CONTRACT'));

-- 3-2. user_checklists
ALTER TABLE user_checklists DROP CONSTRAINT IF EXISTS chk_user_checklists_stage;
ALTER TABLE user_checklists ADD CONSTRAINT chk_user_checklists_stage
    CHECK (stage IN ('ON_SITE', 'PRE_CONTRACT'));

-- 3-3. member_checklist_preferences
ALTER TABLE member_checklist_preferences DROP CONSTRAINT IF EXISTS chk_member_pref_stage;
ALTER TABLE member_checklist_preferences ADD CONSTRAINT chk_member_pref_stage
    CHECK (stage IN ('ON_SITE', 'PRE_CONTRACT'));

-- 3-4. property_checklists
ALTER TABLE property_checklists DROP CONSTRAINT IF EXISTS chk_property_checklists_stage;
ALTER TABLE property_checklists ADD CONSTRAINT chk_property_checklists_stage
    CHECK (stage IN ('ON_SITE', 'PRE_CONTRACT'));
