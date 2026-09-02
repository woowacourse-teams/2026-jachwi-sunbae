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

CREATE TEMPORARY TABLE v4_legacy_maintenance_candidates
(
    property_id      BIGINT UNSIGNED NOT NULL,
    raw_value        VARCHAR(2000)   NOT NULL,
    normalized_value VARCHAR(2000)   NULL,
    parsed_value     BIGINT UNSIGNED NULL,
    PRIMARY KEY (property_id)
);

SET @v4_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'property_details' AND column_name = 'maintenance_amount'
    ),
    'INSERT INTO v4_legacy_maintenance_candidates (property_id, raw_value) SELECT property_id, CAST(maintenance_amount AS CHAR(2000)) FROM property_details WHERE maintenance_amount IS NOT NULL',
    'SELECT 1'
);
PREPARE v4_statement FROM @v4_sql;
EXECUTE v4_statement;
DEALLOCATE PREPARE v4_statement;

UPDATE v4_legacy_maintenance_candidates
SET normalized_value = COALESCE(NULLIF(TRIM(LEADING '0' FROM REGEXP_REPLACE(TRIM(raw_value), ',', '')), ''), '0')
WHERE TRIM(raw_value) REGEXP '^[0-9][0-9,]*$';

UPDATE v4_legacy_maintenance_candidates
SET parsed_value = CAST(normalized_value AS UNSIGNED)
WHERE normalized_value IS NOT NULL
  AND (
      CHAR_LENGTH(normalized_value) < 20
      OR (CHAR_LENGTH(normalized_value) = 20 AND normalized_value <= '18446744073709551615')
  );

UPDATE property_details AS detail
JOIN v4_legacy_maintenance_candidates AS candidate ON candidate.property_id = detail.property_id
SET detail.maintenance_fee_amount = candidate.parsed_value
WHERE detail.maintenance_fee_amount IS NULL
  AND candidate.parsed_value IS NOT NULL;

INSERT INTO migration_backfill_failures (
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
       'property_details',
       detail.property_id,
       'property_details',
       'maintenance_fee_amount',
       candidate.raw_value,
       'unparseable amount',
       CURRENT_TIMESTAMP(6)
FROM property_details AS detail
JOIN v4_legacy_maintenance_candidates AS candidate ON candidate.property_id = detail.property_id
WHERE detail.maintenance_fee_amount IS NULL
  AND candidate.parsed_value IS NULL
ON DUPLICATE KEY UPDATE
    raw_value = VALUES(raw_value),
    reason = VALUES(reason),
    created_at = VALUES(created_at);

DROP TEMPORARY TABLE v4_legacy_maintenance_candidates;

UPDATE property_details AS detail
JOIN property_memos AS memo ON memo.property_id = detail.property_id
JOIN property_memo_items AS item
  ON item.property_memo_id = memo.id AND item.system_memo_item_id = 5
SET detail.discovery_source = item.content
WHERE (detail.discovery_source IS NULL OR detail.discovery_source = '')
  AND TRIM(item.content) <> '';

CREATE TEMPORARY TABLE v4_date_candidates
(
    item_id      BIGINT UNSIGNED NOT NULL,
    raw_value    VARCHAR(200)    NOT NULL,
    year_value   SMALLINT UNSIGNED NOT NULL,
    month_value  TINYINT UNSIGNED NOT NULL,
    day_value    TINYINT UNSIGNED NOT NULL,
    parsed_value DATE            NULL,
    PRIMARY KEY (item_id)
);

INSERT INTO v4_date_candidates (
    item_id,
    raw_value,
    year_value,
    month_value,
    day_value
)
SELECT candidate.item_id,
       candidate.raw_value,
       CAST(SUBSTRING_INDEX(COALESCE(candidate.normalized_value, '0-0-0'), '-', 1) AS UNSIGNED),
       CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(COALESCE(candidate.normalized_value, '0-0-0'), '-', 2), '-', -1)
           AS UNSIGNED),
       CAST(SUBSTRING_INDEX(COALESCE(candidate.normalized_value, '0-0-0'), '-', -1) AS UNSIGNED)
FROM (
    SELECT item.id AS item_id,
           item.content AS raw_value,
           CASE
               WHEN item.content REGEXP '^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}$'
                   THEN TRIM(item.content)
               WHEN item.content REGEXP '^[0-9]{4}\\.[0-9]{1,2}\\.[0-9]{1,2}$'
                   THEN REPLACE(TRIM(item.content), '.', '-')
               WHEN item.content REGEXP '^[0-9]{4}/[0-9]{1,2}/[0-9]{1,2}$'
                   THEN REPLACE(TRIM(item.content), '/', '-')
               WHEN item.content REGEXP '^[0-9]{4}년[[:space:]]*[0-9]{1,2}월[[:space:]]*[0-9]{1,2}일$'
                   THEN REGEXP_REPLACE(
                       REPLACE(REPLACE(REPLACE(TRIM(item.content), '년', '-'), '월', '-'), '일', ''),
                       '[[:space:]]',
                       ''
                   )
           END AS normalized_value
    FROM property_memo_items AS item
    WHERE item.system_memo_item_id = 1
      AND TRIM(item.content) <> ''
) AS candidate;

UPDATE v4_date_candidates
SET parsed_value = DATE_ADD(
    DATE_ADD(MAKEDATE(year_value, 1), INTERVAL (month_value - 1) MONTH),
    INTERVAL (day_value - 1) DAY
)
WHERE year_value BETWEEN 1000 AND 9999
  AND month_value BETWEEN 1 AND 12
  AND day_value BETWEEN 1 AND DAY(
      LAST_DAY(DATE_ADD(MAKEDATE(year_value, 1), INTERVAL (month_value - 1) MONTH))
  );

UPDATE property_details AS detail
JOIN property_memos AS memo ON memo.property_id = detail.property_id
JOIN property_memo_items AS item
  ON item.property_memo_id = memo.id AND item.system_memo_item_id = 1
JOIN v4_date_candidates AS candidate ON candidate.item_id = item.id
SET detail.available_move_in_date = candidate.parsed_value
WHERE detail.available_move_in_date IS NULL
  AND candidate.parsed_value IS NOT NULL;

INSERT INTO migration_backfill_failures (
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
JOIN v4_date_candidates AS candidate ON candidate.item_id = item.id
WHERE detail.available_move_in_date IS NULL
  AND TRIM(item.content) <> ''
ON DUPLICATE KEY UPDATE
    raw_value = VALUES(raw_value),
    reason = VALUES(reason),
    created_at = VALUES(created_at);

DROP TEMPORARY TABLE v4_date_candidates;

CREATE TEMPORARY TABLE v4_amount_candidates
(
    item_id          BIGINT UNSIGNED NOT NULL,
    property_id      BIGINT UNSIGNED NOT NULL,
    raw_value        VARCHAR(200)    NOT NULL,
    multiplier       SMALLINT UNSIGNED NOT NULL,
    normalized_value VARCHAR(200)    NULL,
    parsed_value     BIGINT UNSIGNED NULL,
    PRIMARY KEY (item_id)
);

INSERT INTO v4_amount_candidates (item_id, property_id, raw_value, multiplier, normalized_value)
SELECT item.id,
       memo.property_id,
       item.content,
       CASE
           WHEN item.content REGEXP '^[[:space:]]*[0-9][0-9,]*[[:space:]]*(만원|만)[[:space:]]*$' THEN 10000
           ELSE 1
       END,
       CASE
           WHEN item.content REGEXP '^[[:space:]]*[0-9][0-9,]*[[:space:]]*(만원|만)[[:space:]]*$'
               THEN COALESCE(NULLIF(TRIM(LEADING '0' FROM REGEXP_REPLACE(TRIM(item.content), '[^0-9]', '')), ''), '0')
           WHEN item.content REGEXP '^[[:space:]]*[0-9][0-9,]*[[:space:]]*원[[:space:]]*$'
               THEN COALESCE(NULLIF(TRIM(LEADING '0' FROM REGEXP_REPLACE(TRIM(item.content), '[^0-9]', '')), ''), '0')
           WHEN item.content REGEXP '^[[:space:]]*[0-9][0-9,]*[[:space:]]*$'
               THEN COALESCE(NULLIF(TRIM(LEADING '0' FROM REGEXP_REPLACE(TRIM(item.content), '[^0-9]', '')), ''), '0')
           ELSE NULL
       END
FROM property_memos AS memo
JOIN property_memo_items AS item
  ON item.property_memo_id = memo.id AND item.system_memo_item_id = 3
WHERE TRIM(item.content) <> '';

UPDATE v4_amount_candidates
SET parsed_value = CAST(normalized_value AS UNSIGNED) * multiplier
WHERE normalized_value IS NOT NULL
  AND (
      (multiplier = 1 AND (
          CHAR_LENGTH(normalized_value) < 20
          OR (CHAR_LENGTH(normalized_value) = 20 AND normalized_value <= '18446744073709551615')
      ))
      OR (multiplier = 10000 AND (
          CHAR_LENGTH(normalized_value) < 16
          OR (CHAR_LENGTH(normalized_value) = 16 AND normalized_value <= '1844674407370955')
      ))
  );

UPDATE property_details AS detail
JOIN v4_amount_candidates AS candidate ON candidate.property_id = detail.property_id
SET detail.maintenance_fee_amount = candidate.parsed_value
WHERE detail.maintenance_fee_amount IS NULL
  AND candidate.parsed_value IS NOT NULL;

INSERT INTO migration_backfill_failures (
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
JOIN v4_amount_candidates AS candidate ON candidate.item_id = item.id
WHERE detail.maintenance_fee_amount IS NULL
  AND TRIM(item.content) <> ''
  AND candidate.parsed_value IS NULL
ON DUPLICATE KEY UPDATE
    raw_value = VALUES(raw_value),
    reason = VALUES(reason),
    created_at = VALUES(created_at);

DROP TEMPORARY TABLE v4_amount_candidates;

CREATE TEMPORARY TABLE v4_datetime_candidates
(
    item_id      BIGINT UNSIGNED NOT NULL,
    raw_value    VARCHAR(200)    NOT NULL,
    year_value   SMALLINT UNSIGNED NOT NULL,
    month_value  TINYINT UNSIGNED NOT NULL,
    day_value    TINYINT UNSIGNED NOT NULL,
    hour_value   TINYINT UNSIGNED NOT NULL,
    minute_value TINYINT UNSIGNED NOT NULL,
    second_value TINYINT UNSIGNED NOT NULL,
    parsed_value DATETIME(6)      NULL,
    PRIMARY KEY (item_id)
);

INSERT INTO v4_datetime_candidates (
    item_id,
    raw_value,
    year_value,
    month_value,
    day_value,
    hour_value,
    minute_value,
    second_value
)
SELECT candidate.item_id,
       candidate.raw_value,
       CAST(SUBSTRING(candidate.normalized_value, 1, 4) AS UNSIGNED),
       CAST(SUBSTRING(candidate.normalized_value, 6, 2) AS UNSIGNED),
       CAST(SUBSTRING(candidate.normalized_value, 9, 2) AS UNSIGNED),
       CAST(SUBSTRING(candidate.normalized_value, 12, 2) AS UNSIGNED),
       CAST(SUBSTRING(candidate.normalized_value, 15, 2) AS UNSIGNED),
       CAST(SUBSTRING(candidate.normalized_value, 18, 2) AS UNSIGNED)
FROM (
    SELECT item.id AS item_id,
           item.content AS raw_value,
           CASE
               WHEN item.content REGEXP '^[0-9]{4}[-./][0-9]{2}[-./][0-9]{2}[[:space:]][0-9]{2}:[0-9]{2}(:[0-9]{2})?$'
                   THEN CONCAT(REGEXP_REPLACE(TRIM(item.content), '[./]', '-'),
                               CASE WHEN CHAR_LENGTH(TRIM(item.content)) = 16 THEN ':00' ELSE '' END)
               WHEN item.content REGEXP '^[0-9]{4}[-./][0-9]{2}[-./][0-9]{2}$'
                   THEN CONCAT(REGEXP_REPLACE(TRIM(item.content), '[./]', '-'), ' 00:00:00')
               ELSE '0000-00-00 00:00:00'
           END AS normalized_value
    FROM property_memo_items AS item
    WHERE item.system_memo_item_id = 4
      AND TRIM(item.content) <> ''
) AS candidate;

UPDATE v4_datetime_candidates
SET parsed_value = TIMESTAMP(
    DATE_ADD(
        DATE_ADD(MAKEDATE(year_value, 1), INTERVAL (month_value - 1) MONTH),
        INTERVAL (day_value - 1) DAY
    ),
    MAKETIME(hour_value, minute_value, second_value)
)
WHERE year_value BETWEEN 1000 AND 9999
  AND month_value BETWEEN 1 AND 12
  AND day_value BETWEEN 1 AND DAY(
      LAST_DAY(DATE_ADD(MAKEDATE(year_value, 1), INTERVAL (month_value - 1) MONTH))
  )
  AND hour_value BETWEEN 0 AND 23
  AND minute_value BETWEEN 0 AND 59
  AND second_value BETWEEN 0 AND 59;

UPDATE property_details AS detail
JOIN property_memos AS memo ON memo.property_id = detail.property_id
JOIN property_memo_items AS item
  ON item.property_memo_id = memo.id AND item.system_memo_item_id = 4
JOIN v4_datetime_candidates AS candidate ON candidate.item_id = item.id
SET detail.visit_scheduled_at = candidate.parsed_value
WHERE detail.visit_scheduled_at IS NULL
  AND candidate.parsed_value IS NOT NULL;

INSERT INTO migration_backfill_failures (
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
JOIN v4_datetime_candidates AS candidate ON candidate.item_id = item.id
WHERE detail.visit_scheduled_at IS NULL
  AND TRIM(item.content) <> ''
ON DUPLICATE KEY UPDATE
    raw_value = VALUES(raw_value),
    reason = VALUES(reason),
    created_at = VALUES(created_at);

DROP TEMPORARY TABLE v4_datetime_candidates;

INSERT INTO property_room_options (property_id, option_code)
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
WHERE item.content REGEXP '인덕션|INDUCTION'
ON DUPLICATE KEY UPDATE option_code = VALUES(option_code);

INSERT INTO property_utility_options (property_id, utility_code)
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
WHERE item.content REGEXP '인터넷|INTERNET'
ON DUPLICATE KEY UPDATE utility_code = VALUES(utility_code);

UPDATE property_details
SET created_at = CURRENT_TIMESTAMP(6)
WHERE created_at IS NULL;

ALTER TABLE property_details
    MODIFY COLUMN created_at DATETIME(6) NOT NULL;
