-- #176 이전 스키마를 현재 애플리케이션이 읽고 쓸 수 있는 형태로 먼저 보강한다.
-- 뒤의 업그레이드 파일들이 새 스키마의 컬럼을 전제로 하므로 이 파일은 항상 가장 먼저 실행된다.

-- 회원 인증 정보는 nickname_credentials에서 members로 이동했다.
SET @add_member_nickname = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'members' AND column_name = 'nickname'),
    'SELECT 1',
    'ALTER TABLE members ADD COLUMN nickname VARCHAR(50) NULL'
);
PREPARE stmt FROM @add_member_nickname; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_member_nickname_key = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'members' AND column_name = 'nickname_key'),
    'SELECT 1',
    'ALTER TABLE members ADD COLUMN nickname_key VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL'
);
PREPARE stmt FROM @add_member_nickname_key; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_member_password_hash = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'members' AND column_name = 'password_hash'),
    'SELECT 1',
    'ALTER TABLE members ADD COLUMN password_hash VARCHAR(255) NULL'
);
PREPARE stmt FROM @add_member_password_hash; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @copy_legacy_credentials = IF(
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'nickname_credentials'),
    'UPDATE members m JOIN nickname_credentials nc ON nc.member_id = m.id SET m.nickname = COALESCE(m.nickname, nc.nickname), m.nickname_key = COALESCE(m.nickname_key, nc.nickname_key), m.password_hash = COALESCE(m.password_hash, nc.password_hash)',
    'SELECT 1'
);
PREPARE stmt FROM @copy_legacy_credentials; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE members
SET nickname = COALESCE(nickname, CONCAT('기존 사용자 #', id)),
    nickname_key = COALESCE(nickname_key, LOWER(COALESCE(nickname, CONCAT('기존 사용자 #', id))));

ALTER TABLE members
    MODIFY COLUMN nickname VARCHAR(50) NOT NULL,
    MODIFY COLUMN nickname_key VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    MODIFY COLUMN password_hash VARCHAR(255) NULL;

SET @add_member_nickname_key_unique = IF(
    EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'members' AND index_name = 'uk_members_nickname_key'),
    'SELECT 1',
    'ALTER TABLE members ADD CONSTRAINT uk_members_nickname_key UNIQUE (nickname_key)'
);
PREPARE stmt FROM @add_member_nickname_key_unique; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 레거시 전용 회원 컬럼은 롤백 시 읽을 수 있도록 남기되 현재 INSERT를 막지 않게 한다.
SET @relax_member_email = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'members' AND column_name = 'email'),
    'ALTER TABLE members MODIFY COLUMN email VARCHAR(320) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @relax_member_email; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @default_member_name = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'members' AND column_name = 'name'),
    "ALTER TABLE members MODIFY COLUMN name VARCHAR(100) NOT NULL DEFAULT ''",
    'SELECT 1'
);
PREPARE stmt FROM @default_member_name; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @default_member_last_login = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'members' AND column_name = 'last_login_at'),
    'ALTER TABLE members MODIFY COLUMN last_login_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)',
    'SELECT 1'
);
PREPARE stmt FROM @default_member_last_login; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 매물 본문에 새 주소/삭제 컬럼을 추가하고 기존 주소를 보존한다.
SET @add_property_address = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'address'),
    'SELECT 1',
    'ALTER TABLE properties ADD COLUMN address VARCHAR(255) NULL'
);
PREPARE stmt FROM @add_property_address; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @copy_property_address = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'road_address'),
    'UPDATE properties SET address = COALESCE(address, road_address, jibun_address)',
    'SELECT 1'
);
PREPARE stmt FROM @copy_property_address; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_property_deleted_at = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'deleted_at'),
    'SELECT 1',
    'ALTER TABLE properties ADD COLUMN deleted_at DATETIME(6) NULL'
);
PREPARE stmt FROM @add_property_deleted_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @default_property_updated_at = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'updated_at'),
    'ALTER TABLE properties MODIFY COLUMN updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)',
    'SELECT 1'
);
PREPARE stmt FROM @default_property_updated_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @default_property_last_activity_at = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'last_activity_at'),
    'ALTER TABLE properties MODIFY COLUMN last_activity_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)',
    'SELECT 1'
);
PREPARE stmt FROM @default_property_last_activity_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 사진·대표 사진·메모 컬럼을 현재 저장소 쿼리와 맞춘다.
SET @add_photo_member_id = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'property_photos' AND column_name = 'member_id'),
    'SELECT 1',
    'ALTER TABLE property_photos ADD COLUMN member_id BIGINT NULL AFTER property_id'
);
PREPARE stmt FROM @add_photo_member_id; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_photo_checksum = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'property_photos' AND column_name = 'checksum_sha256'),
    'SELECT 1',
    'ALTER TABLE property_photos ADD COLUMN checksum_sha256 CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL AFTER size_bytes'
);
PREPARE stmt FROM @add_photo_checksum; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_photo_deleted_at = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'property_photos' AND column_name = 'deleted_at'),
    'SELECT 1',
    'ALTER TABLE property_photos ADD COLUMN deleted_at DATETIME(6) NULL'
);
PREPARE stmt FROM @add_photo_deleted_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE property_photos ph
JOIN properties p ON p.id = ph.property_id
SET ph.member_id = COALESCE(ph.member_id, p.member_id),
    ph.checksum_sha256 = COALESCE(ph.checksum_sha256, SHA2(ph.storage_key, 256));

SET @add_main_photo_updated_at = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'main_property_photos' AND column_name = 'updated_at'),
    'SELECT 1',
    'ALTER TABLE main_property_photos ADD COLUMN updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)'
);
PREPARE stmt FROM @add_main_photo_updated_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @default_main_photo_updated_at = 'ALTER TABLE main_property_photos MODIFY COLUMN updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)';
PREPARE stmt FROM @default_main_photo_updated_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_property_memo_created_at = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'property_memos' AND column_name = 'created_at'),
    'SELECT 1',
    'ALTER TABLE property_memos ADD COLUMN created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)'
);
PREPARE stmt FROM @add_property_memo_created_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @default_property_memo_created_at = 'ALTER TABLE property_memos MODIFY COLUMN created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)';
PREPARE stmt FROM @default_property_memo_created_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 제공 체크 문항의 새 정렬/생성시각 컬럼을 002 실행 전에 준비한다.
SET @add_system_check_display_order = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'system_check_items' AND column_name = 'display_order'),
    'SELECT 1',
    'ALTER TABLE system_check_items ADD COLUMN display_order SMALLINT UNSIGNED NULL'
);
PREPARE stmt FROM @add_system_check_display_order; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_system_check_created_at = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'system_check_items' AND column_name = 'created_at'),
    'SELECT 1',
    'ALTER TABLE system_check_items ADD COLUMN created_at DATETIME(6) NULL'
);
PREPARE stmt FROM @add_system_check_created_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE system_check_items
SET display_order = COALESCE(display_order, LEAST(id, 65535)),
    created_at = COALESCE(created_at, CURRENT_TIMESTAMP(6));
ALTER TABLE system_check_items
    MODIFY COLUMN display_order SMALLINT UNSIGNED NOT NULL,
    MODIFY COLUMN created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);

-- 체크리스트 스냅샷 컬럼은 과거 사용자 직접 문항까지 읽을 수 있도록 유지한다.
SET @add_user_checklist_created_at = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user_checklists' AND column_name = 'created_at'),
    'SELECT 1',
    'ALTER TABLE user_checklists ADD COLUMN created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)'
);
PREPARE stmt FROM @add_user_checklist_created_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_user_checklist_deleted_at = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user_checklists' AND column_name = 'deleted_at'),
    'SELECT 1',
    'ALTER TABLE user_checklists ADD COLUMN deleted_at DATETIME(6) NULL'
);
PREPARE stmt FROM @add_user_checklist_deleted_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_user_item_stage = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user_checklist_items' AND column_name = 'stage'),
    'SELECT 1',
    'ALTER TABLE user_checklist_items ADD COLUMN stage VARCHAR(30) NULL'
);
PREPARE stmt FROM @add_user_item_stage; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_user_item_type = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user_checklist_items' AND column_name = 'item_type'),
    'SELECT 1',
    'ALTER TABLE user_checklist_items ADD COLUMN item_type VARCHAR(20) NULL'
);
PREPARE stmt FROM @add_user_item_type; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_user_item_question = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user_checklist_items' AND column_name = 'question'),
    'SELECT 1',
    'ALTER TABLE user_checklist_items ADD COLUMN question VARCHAR(200) NULL'
);
PREPARE stmt FROM @add_user_item_question; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE user_checklist_items uci
LEFT JOIN system_check_items sci ON sci.id = uci.system_check_item_id
SET uci.stage = COALESCE(uci.stage, sci.stage),
    uci.item_type = COALESCE(uci.item_type, sci.item_type),
    uci.question = COALESCE(uci.question, sci.question);

SET @add_property_checklist_created_at = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'property_checklists' AND column_name = 'created_at'),
    'SELECT 1',
    'ALTER TABLE property_checklists ADD COLUMN created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)'
);
PREPARE stmt FROM @add_property_checklist_created_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_property_checklist_updated_at = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'property_checklists' AND column_name = 'updated_at'),
    'SELECT 1',
    'ALTER TABLE property_checklists ADD COLUMN updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)'
);
PREPARE stmt FROM @add_property_checklist_updated_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_property_checklist_item_created_at = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'property_checklist_items' AND column_name = 'created_at'),
    'SELECT 1',
    'ALTER TABLE property_checklist_items ADD COLUMN created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)'
);
PREPARE stmt FROM @add_property_checklist_item_created_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;
