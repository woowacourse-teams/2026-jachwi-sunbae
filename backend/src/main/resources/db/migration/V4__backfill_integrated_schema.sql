SET @v4_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'members' AND column_name = 'name'
    )
    AND EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'members' AND column_name = 'display_name'
    ),
    'UPDATE members SET name = display_name WHERE name IS NULL',
    'SELECT 1'
);
PREPARE v4_statement FROM @v4_sql;
EXECUTE v4_statement;
DEALLOCATE PREPARE v4_statement;

UPDATE members AS member
JOIN nickname_credentials AS credential ON credential.member_id = member.id
SET member.nickname = COALESCE(member.nickname, credential.nickname),
    member.nickname_key = COALESCE(member.nickname_key, credential.nickname_key),
    member.password_hash = COALESCE(member.password_hash, credential.password_hash)
WHERE member.nickname IS NULL
   OR member.nickname_key IS NULL
   OR member.password_hash IS NULL;

UPDATE properties
SET address = CASE
    WHEN address IS NOT NULL AND TRIM(address) <> '' THEN address
    WHEN road_address IS NOT NULL AND TRIM(road_address) <> '' THEN road_address
    WHEN jibun_address IS NOT NULL AND TRIM(jibun_address) <> '' THEN jibun_address
    ELSE address
END
WHERE address IS NULL OR TRIM(address) = '';

INSERT INTO property_details (
    property_id,
    available_move_in_date,
    maintenance_fee_amount,
    visit_scheduled_at,
    discovery_source,
    created_at
)
SELECT property.id,
       NULL,
       NULL,
       NULL,
       property.discovery_source,
       COALESCE(property.created_at, CURRENT_TIMESTAMP(6))
FROM properties AS property
LEFT JOIN property_details AS detail ON detail.property_id = property.id
WHERE detail.property_id IS NULL;

UPDATE property_details AS detail
JOIN properties AS property ON property.id = detail.property_id
SET detail.discovery_source = property.discovery_source
WHERE detail.discovery_source IS NULL;

SET @v4_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'property_details' AND column_name = 'maintenance_amount'
    ),
    'UPDATE property_details SET maintenance_fee_amount = CAST(maintenance_amount AS UNSIGNED) WHERE maintenance_fee_amount IS NULL AND maintenance_amount IS NOT NULL',
    'SELECT 1'
);
PREPARE v4_statement FROM @v4_sql;
EXECUTE v4_statement;
DEALLOCATE PREPARE v4_statement;

UPDATE property_details AS detail
JOIN property_memos AS memo ON memo.property_id = detail.property_id
JOIN property_memo_items AS item
  ON item.property_memo_id = memo.id AND item.system_memo_item_id = 5
SET detail.discovery_source = item.content
WHERE (detail.discovery_source IS NULL OR detail.discovery_source = '')
  AND TRIM(item.content) <> '';

UPDATE property_details AS detail
JOIN property_memos AS memo ON memo.property_id = detail.property_id
JOIN property_memo_items AS item
  ON item.property_memo_id = memo.id AND item.system_memo_item_id = 1
SET detail.available_move_in_date = COALESCE(
    CASE WHEN item.content REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        THEN STR_TO_DATE(TRIM(item.content), '%Y-%m-%d') END,
    CASE WHEN item.content REGEXP '^[0-9]{4}\\.[0-9]{2}\\.[0-9]{2}$'
        THEN STR_TO_DATE(TRIM(item.content), '%Y.%m.%d') END,
    CASE WHEN item.content REGEXP '^[0-9]{4}/[0-9]{2}/[0-9]{2}$'
        THEN STR_TO_DATE(TRIM(item.content), '%Y/%m/%d') END,
    CASE WHEN item.content REGEXP '^[0-9]{4}년[[:space:]]*[0-9]{1,2}월[[:space:]]*[0-9]{1,2}일$'
        THEN STR_TO_DATE(REPLACE(REPLACE(REPLACE(TRIM(item.content), '년', '-'), '월', '-'), '일', ''), '%Y-%m-%d') END
)
WHERE detail.available_move_in_date IS NULL
  AND TRIM(item.content) <> ''
  AND item.content REGEXP '[0-9]';

INSERT IGNORE INTO migration_backfill_failures (
    migration_version,
    source_table,
    source_id,
    target_table,
    target_column,
    raw_value,
    reason,
    created_at
)
SELECT 'V4',
       'property_memo_items',
       item.id,
       'property_details',
       'available_move_in_date',
       item.content,
       'unparseable date',
       CURRENT_TIMESTAMP(6)
FROM property_memos AS memo
JOIN property_memo_items AS item
  ON item.property_memo_id = memo.id AND item.system_memo_item_id = 1
JOIN property_details AS detail ON detail.property_id = memo.property_id
WHERE detail.available_move_in_date IS NULL
  AND TRIM(item.content) <> '';

UPDATE property_details AS detail
JOIN property_memos AS memo ON memo.property_id = detail.property_id
JOIN property_memo_items AS item
  ON item.property_memo_id = memo.id AND item.system_memo_item_id = 3
SET detail.maintenance_fee_amount = CASE
    WHEN item.content REGEXP '^[[:space:]]*[0-9][0-9,]*[[:space:]]*(만원|만)[[:space:]]*$'
        THEN CAST(REGEXP_REPLACE(TRIM(item.content), '[^0-9]', '') AS UNSIGNED) * 10000
    WHEN item.content REGEXP '^[[:space:]]*[0-9][0-9,]*[[:space:]]*원[[:space:]]*$'
        THEN CAST(REGEXP_REPLACE(TRIM(item.content), '[^0-9]', '') AS UNSIGNED)
    WHEN item.content REGEXP '^[[:space:]]*[0-9][0-9,]*[[:space:]]*$'
        THEN CAST(REGEXP_REPLACE(TRIM(item.content), '[^0-9]', '') AS UNSIGNED)
    ELSE detail.maintenance_fee_amount
END
WHERE detail.maintenance_fee_amount IS NULL
  AND TRIM(item.content) <> '';

INSERT IGNORE INTO migration_backfill_failures (
    migration_version,
    source_table,
    source_id,
    target_table,
    target_column,
    raw_value,
    reason,
    created_at
)
SELECT 'V4',
       'property_memo_items',
       item.id,
       'property_details',
       'maintenance_fee_amount',
       item.content,
       'unparseable amount',
       CURRENT_TIMESTAMP(6)
FROM property_memos AS memo
JOIN property_memo_items AS item
  ON item.property_memo_id = memo.id AND item.system_memo_item_id = 3
JOIN property_details AS detail ON detail.property_id = memo.property_id
WHERE detail.maintenance_fee_amount IS NULL
  AND TRIM(item.content) <> '';

UPDATE property_details AS detail
JOIN property_memos AS memo ON memo.property_id = detail.property_id
JOIN property_memo_items AS item
  ON item.property_memo_id = memo.id AND item.system_memo_item_id = 4
SET detail.visit_scheduled_at = COALESCE(
    CASE WHEN item.content REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$'
        THEN STR_TO_DATE(TRIM(item.content), '%Y-%m-%d %H:%i:%s') END,
    CASE WHEN item.content REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}$'
        THEN STR_TO_DATE(TRIM(item.content), '%Y-%m-%d %H:%i') END,
    CASE WHEN item.content REGEXP '^[0-9]{4}\\.[0-9]{2}\\.[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$'
        THEN STR_TO_DATE(TRIM(item.content), '%Y.%m.%d %H:%i:%s') END,
    CASE WHEN item.content REGEXP '^[0-9]{4}\\.[0-9]{2}\\.[0-9]{2} [0-9]{2}:[0-9]{2}$'
        THEN STR_TO_DATE(TRIM(item.content), '%Y.%m.%d %H:%i') END,
    CASE WHEN item.content REGEXP '^[0-9]{4}/[0-9]{2}/[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$'
        THEN STR_TO_DATE(TRIM(item.content), '%Y/%m/%d %H:%i:%s') END,
    CASE WHEN item.content REGEXP '^[0-9]{4}/[0-9]{2}/[0-9]{2} [0-9]{2}:[0-9]{2}$'
        THEN STR_TO_DATE(TRIM(item.content), '%Y/%m/%d %H:%i') END,
    CASE WHEN item.content REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        THEN STR_TO_DATE(TRIM(item.content), '%Y-%m-%d') END,
    CASE WHEN item.content REGEXP '^[0-9]{4}\\.[0-9]{2}\\.[0-9]{2}$'
        THEN STR_TO_DATE(TRIM(item.content), '%Y.%m.%d') END,
    CASE WHEN item.content REGEXP '^[0-9]{4}/[0-9]{2}/[0-9]{2}$'
        THEN STR_TO_DATE(TRIM(item.content), '%Y/%m/%d') END
)
WHERE detail.visit_scheduled_at IS NULL
  AND TRIM(item.content) <> ''
  AND item.content REGEXP '[0-9]';

INSERT IGNORE INTO migration_backfill_failures (
    migration_version,
    source_table,
    source_id,
    target_table,
    target_column,
    raw_value,
    reason,
    created_at
)
SELECT 'V4',
       'property_memo_items',
       item.id,
       'property_details',
       'visit_scheduled_at',
       item.content,
       'unparseable datetime',
       CURRENT_TIMESTAMP(6)
FROM property_memos AS memo
JOIN property_memo_items AS item
  ON item.property_memo_id = memo.id AND item.system_memo_item_id = 4
JOIN property_details AS detail ON detail.property_id = memo.property_id
WHERE detail.visit_scheduled_at IS NULL
  AND TRIM(item.content) <> '';

INSERT IGNORE INTO property_room_options (property_id, option_code)
SELECT memo.property_id, 'AIR_CONDITIONER'
FROM property_memos AS memo
JOIN property_memo_items AS item ON item.property_memo_id = memo.id AND item.system_memo_item_id = 2
WHERE item.content REGEXP '에어컨|에어콘|AIR[ _-]?CONDITIONER'
UNION ALL
SELECT memo.property_id, 'REFRIGERATOR'
FROM property_memos AS memo
JOIN property_memo_items AS item ON item.property_memo_id = memo.id AND item.system_memo_item_id = 2
WHERE item.content REGEXP '냉장고|REFRIGERATOR'
UNION ALL
SELECT memo.property_id, 'WASHING_MACHINE'
FROM property_memos AS memo
JOIN property_memo_items AS item ON item.property_memo_id = memo.id AND item.system_memo_item_id = 2
WHERE item.content REGEXP '세탁기|WASHING[ _-]?MACHINE'
UNION ALL
SELECT memo.property_id, 'SINK'
FROM property_memos AS memo
JOIN property_memo_items AS item ON item.property_memo_id = memo.id AND item.system_memo_item_id = 2
WHERE item.content REGEXP '싱크대|SINK'
UNION ALL
SELECT memo.property_id, 'GAS_STOVE'
FROM property_memos AS memo
JOIN property_memo_items AS item ON item.property_memo_id = memo.id AND item.system_memo_item_id = 2
WHERE item.content REGEXP '가스레인지|가스렌지|GAS[ _-]?STOVE'
UNION ALL
SELECT memo.property_id, 'MICROWAVE'
FROM property_memos AS memo
JOIN property_memo_items AS item ON item.property_memo_id = memo.id AND item.system_memo_item_id = 2
WHERE item.content REGEXP '전자레인지|MICROWAVE'
UNION ALL
SELECT memo.property_id, 'SHOE_CABINET'
FROM property_memos AS memo
JOIN property_memo_items AS item ON item.property_memo_id = memo.id AND item.system_memo_item_id = 2
WHERE item.content REGEXP '신발장|SHOE[ _-]?CABINET'
UNION ALL
SELECT memo.property_id, 'WARDROBE'
FROM property_memos AS memo
JOIN property_memo_items AS item ON item.property_memo_id = memo.id AND item.system_memo_item_id = 2
WHERE item.content REGEXP '옷장|WARDROBE'
UNION ALL
SELECT memo.property_id, 'BED'
FROM property_memos AS memo
JOIN property_memo_items AS item ON item.property_memo_id = memo.id AND item.system_memo_item_id = 2
WHERE item.content REGEXP '침대|BED'
UNION ALL
SELECT memo.property_id, 'DESK'
FROM property_memos AS memo
JOIN property_memo_items AS item ON item.property_memo_id = memo.id AND item.system_memo_item_id = 2
WHERE item.content REGEXP '책상|DESK'
UNION ALL
SELECT memo.property_id, 'TV'
FROM property_memos AS memo
JOIN property_memo_items AS item ON item.property_memo_id = memo.id AND item.system_memo_item_id = 2
WHERE item.content REGEXP '(^|[^A-Z])TV([^A-Z]|$)|티비|텔레비전'
UNION ALL
SELECT memo.property_id, 'INDUCTION'
FROM property_memos AS memo
JOIN property_memo_items AS item ON item.property_memo_id = memo.id AND item.system_memo_item_id = 2
WHERE item.content REGEXP '인덕션|INDUCTION';

INSERT IGNORE INTO property_utility_options (property_id, utility_code)
SELECT memo.property_id, 'WATER'
FROM property_memos AS memo
JOIN property_memo_items AS item ON item.property_memo_id = memo.id AND item.system_memo_item_id = 3
WHERE item.content REGEXP '수도|물|WATER'
UNION ALL
SELECT memo.property_id, 'ELECTRICITY'
FROM property_memos AS memo
JOIN property_memo_items AS item ON item.property_memo_id = memo.id AND item.system_memo_item_id = 3
WHERE item.content REGEXP '전기|ELECTRICITY'
UNION ALL
SELECT memo.property_id, 'GAS'
FROM property_memos AS memo
JOIN property_memo_items AS item ON item.property_memo_id = memo.id AND item.system_memo_item_id = 3
WHERE item.content REGEXP '가스|GAS'
UNION ALL
SELECT memo.property_id, 'INTERNET'
FROM property_memos AS memo
JOIN property_memo_items AS item ON item.property_memo_id = memo.id AND item.system_memo_item_id = 3
WHERE item.content REGEXP '인터넷|INTERNET';

UPDATE property_details
SET created_at = CURRENT_TIMESTAMP(6)
WHERE created_at IS NULL;

ALTER TABLE property_details
    MODIFY COLUMN created_at DATETIME(6) NOT NULL;
