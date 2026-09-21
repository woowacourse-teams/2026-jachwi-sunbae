SET @add_legacy_property_name = IF(
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'properties')
        AND NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'legacy_name'),
    'ALTER TABLE properties ADD COLUMN legacy_name VARCHAR(50) NULL AFTER name',
    'SELECT 1'
);
PREPARE stmt FROM @add_legacy_property_name; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE properties
SET legacy_name = COALESCE(legacy_name, name),
    name = LEFT(name, 30)
WHERE CHAR_LENGTH(name) > 30;

SET @backfill_property_details = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'discovery_source'),
    "INSERT INTO property_details (property_id, available_move_in_date, maintenance_fee_amount, visit_scheduled_at, discovery_source, created_at) SELECT id, NULL, 0, NULL, discovery_source, created_at FROM properties ON DUPLICATE KEY UPDATE discovery_source = COALESCE(property_details.discovery_source, VALUES(discovery_source))",
    'SELECT 1'
);
PREPARE stmt FROM @backfill_property_details; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @backfill_property_memos = IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'memo'),
    "INSERT INTO property_memos (property_id, free_memo, created_at) SELECT id, LEFT(COALESCE(memo, ''), 2000), created_at FROM properties ON DUPLICATE KEY UPDATE free_memo = IF(property_memos.free_memo = '', VALUES(free_memo), property_memos.free_memo)",
    'SELECT 1'
);
PREPARE stmt FROM @backfill_property_memos; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TEMPORARY TABLE main_pre_visit_detail_candidates (
    property_id BIGINT PRIMARY KEY,
    move_year SMALLINT UNSIGNED NULL,
    move_month TINYINT UNSIGNED NULL,
    move_day TINYINT UNSIGNED NULL,
    visit_year SMALLINT UNSIGNED NULL,
    visit_month TINYINT UNSIGNED NULL,
    visit_day TINYINT UNSIGNED NULL,
    visit_hour TINYINT UNSIGNED NULL,
    visit_minute TINYINT UNSIGNED NULL,
    visit_second TINYINT UNSIGNED NULL,
    available_move_in_date DATE NULL,
    visit_scheduled_at DATETIME(6) NULL
);

SET @load_pre_visit_detail_candidates = IF(
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'property_pre_visit_memos'),
    "INSERT INTO main_pre_visit_detail_candidates (property_id, move_year, move_month, move_day, visit_year, visit_month, visit_day, visit_hour, visit_minute, visit_second) SELECT property_id, IF(TRIM(move_in_availability) REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$', CAST(SUBSTRING(TRIM(move_in_availability), 1, 4) AS UNSIGNED), NULL), IF(TRIM(move_in_availability) REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$', CAST(SUBSTRING(TRIM(move_in_availability), 6, 2) AS UNSIGNED), NULL), IF(TRIM(move_in_availability) REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$', CAST(SUBSTRING(TRIM(move_in_availability), 9, 2) AS UNSIGNED), NULL), IF(TRIM(viewing_schedule) REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}(:[0-9]{2})?$', CAST(SUBSTRING(TRIM(viewing_schedule), 1, 4) AS UNSIGNED), NULL), IF(TRIM(viewing_schedule) REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}(:[0-9]{2})?$', CAST(SUBSTRING(TRIM(viewing_schedule), 6, 2) AS UNSIGNED), NULL), IF(TRIM(viewing_schedule) REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}(:[0-9]{2})?$', CAST(SUBSTRING(TRIM(viewing_schedule), 9, 2) AS UNSIGNED), NULL), IF(TRIM(viewing_schedule) REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}(:[0-9]{2})?$', CAST(SUBSTRING(TRIM(viewing_schedule), 12, 2) AS UNSIGNED), NULL), IF(TRIM(viewing_schedule) REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}(:[0-9]{2})?$', CAST(SUBSTRING(TRIM(viewing_schedule), 15, 2) AS UNSIGNED), NULL), IF(CHAR_LENGTH(TRIM(viewing_schedule)) = 19 AND TRIM(viewing_schedule) REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$', CAST(SUBSTRING(TRIM(viewing_schedule), 18, 2) AS UNSIGNED), 0) FROM property_pre_visit_memos",
    'SELECT 1'
);
PREPARE stmt FROM @load_pre_visit_detail_candidates; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE main_pre_visit_detail_candidates
SET available_move_in_date = DATE_ADD(
    DATE_ADD(MAKEDATE(move_year, 1), INTERVAL (move_month - 1) MONTH),
    INTERVAL (move_day - 1) DAY
)
WHERE move_year BETWEEN 1000 AND 9999
  AND move_month BETWEEN 1 AND 12
  AND move_day BETWEEN 1 AND DAY(LAST_DAY(DATE_ADD(MAKEDATE(move_year, 1), INTERVAL (move_month - 1) MONTH)));

UPDATE main_pre_visit_detail_candidates
SET visit_scheduled_at = TIMESTAMP(
    DATE_ADD(
        DATE_ADD(MAKEDATE(visit_year, 1), INTERVAL (visit_month - 1) MONTH),
        INTERVAL (visit_day - 1) DAY
    ),
    MAKETIME(visit_hour, visit_minute, visit_second)
)
WHERE visit_year BETWEEN 1000 AND 9999
  AND visit_month BETWEEN 1 AND 12
  AND visit_day BETWEEN 1 AND DAY(LAST_DAY(DATE_ADD(MAKEDATE(visit_year, 1), INTERVAL (visit_month - 1) MONTH)))
  AND visit_hour BETWEEN 0 AND 23
  AND visit_minute BETWEEN 0 AND 59
  AND visit_second BETWEEN 0 AND 59;

UPDATE property_details detail
JOIN main_pre_visit_detail_candidates candidate ON candidate.property_id = detail.property_id
SET detail.available_move_in_date = COALESCE(detail.available_move_in_date, candidate.available_move_in_date),
    detail.visit_scheduled_at = COALESCE(detail.visit_scheduled_at, candidate.visit_scheduled_at);

DROP TEMPORARY TABLE main_pre_visit_detail_candidates;

SET @backfill_pre_visit_room_options = IF(
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'property_pre_visit_memos'),
    "INSERT IGNORE INTO property_room_options (property_id, option_code) SELECT property_id, 'AIR_CONDITIONER' FROM property_pre_visit_memos WHERE room_options REGEXP '에어컨|에어콘|AIR[ _-]?CONDITIONER' UNION ALL SELECT property_id, 'REFRIGERATOR' FROM property_pre_visit_memos WHERE room_options REGEXP '냉장고|REFRIGERATOR' UNION ALL SELECT property_id, 'WASHING_MACHINE' FROM property_pre_visit_memos WHERE room_options REGEXP '세탁기|WASHING[ _-]?MACHINE' UNION ALL SELECT property_id, 'SINK' FROM property_pre_visit_memos WHERE room_options REGEXP '싱크대|싱크|SINK' UNION ALL SELECT property_id, 'GAS_STOVE' FROM property_pre_visit_memos WHERE room_options REGEXP '가스레인지|가스렌지|GAS[ _-]?STOVE' UNION ALL SELECT property_id, 'MICROWAVE' FROM property_pre_visit_memos WHERE room_options REGEXP '전자레인지|전자렌지|MICROWAVE' UNION ALL SELECT property_id, 'SHOE_CABINET' FROM property_pre_visit_memos WHERE room_options REGEXP '신발장|SHOE[ _-]?CABINET' UNION ALL SELECT property_id, 'WARDROBE' FROM property_pre_visit_memos WHERE room_options REGEXP '옷장|장롱|WARDROBE' UNION ALL SELECT property_id, 'BED' FROM property_pre_visit_memos WHERE room_options REGEXP '침대|BED' UNION ALL SELECT property_id, 'DESK' FROM property_pre_visit_memos WHERE room_options REGEXP '책상|DESK' UNION ALL SELECT property_id, 'TV' FROM property_pre_visit_memos WHERE room_options REGEXP '티비|텔레비전|(^|[^A-Z])TV([^A-Z]|$)' UNION ALL SELECT property_id, 'INDUCTION' FROM property_pre_visit_memos WHERE room_options REGEXP '인덕션|INDUCTION'",
    'SELECT 1'
);
PREPARE stmt FROM @backfill_pre_visit_room_options; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @backfill_pre_visit_utility_options = IF(
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'property_pre_visit_memos'),
    "INSERT IGNORE INTO property_utility_options (property_id, utility_code) SELECT property_id, 'WATER' FROM property_pre_visit_memos WHERE maintenance_and_utilities REGEXP '수도|수도세|WATER' UNION ALL SELECT property_id, 'ELECTRICITY' FROM property_pre_visit_memos WHERE maintenance_and_utilities REGEXP '전기|전기세|ELECTRICITY' UNION ALL SELECT property_id, 'GAS' FROM property_pre_visit_memos WHERE maintenance_and_utilities REGEXP '가스|가스비|GAS' UNION ALL SELECT property_id, 'INTERNET' FROM property_pre_visit_memos WHERE maintenance_and_utilities REGEXP '인터넷|INTERNET'",
    'SELECT 1'
);
PREPARE stmt FROM @backfill_pre_visit_utility_options; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @backfill_pre_visit_memo = IF(
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'property_pre_visit_memos'),
    "UPDATE property_memos memo JOIN properties property ON property.id = memo.property_id JOIN property_pre_visit_memos legacy ON legacy.property_id = memo.property_id SET memo.free_memo = LEFT(CONCAT_WS(CHAR(10), '[이전 사전방문 메모]', IF(TRIM(legacy.viewing_schedule) = '', NULL, CONCAT('집 보기 일정: ', legacy.viewing_schedule)), IF(TRIM(legacy.move_in_availability) = '', NULL, CONCAT('입주 가능 시점: ', legacy.move_in_availability)), IF(TRIM(legacy.provisional_deposit) = '', NULL, CONCAT('가계약금·예약금: ', legacy.provisional_deposit)), IF(TRIM(legacy.room_options) = '', NULL, CONCAT('방 옵션: ', legacy.room_options)), IF(TRIM(legacy.maintenance_and_utilities) = '', NULL, CONCAT('관리비·공과금: ', legacy.maintenance_and_utilities)), IF(TRIM(legacy.commute_time) = '', NULL, CONCAT('통근 시간: ', legacy.commute_time)), IF(TRIM(legacy.government_support) = '', NULL, CONCAT('정부 지원: ', legacy.government_support)), IF(TRIM(legacy.additional_memo) = '' OR legacy.additional_memo = property.memo, NULL, CONCAT('추가 메모: ', legacy.additional_memo)), NULLIF(property.memo, '')), 2000)",
    'SELECT 1'
);
PREPARE stmt FROM @backfill_pre_visit_memo; EXECUTE stmt; DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO main_property_photos (property_id, property_photos_id)
SELECT property_id, MIN(id)
FROM property_photos
WHERE deleted_at IS NULL
GROUP BY property_id;
