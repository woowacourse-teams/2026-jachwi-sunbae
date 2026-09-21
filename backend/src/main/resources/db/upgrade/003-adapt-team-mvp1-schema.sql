-- 팀 저장소의 Flyway V11 스키마를 기존 데이터 손실 없이 MVP2 런타임 계약으로 보강한다.
-- 새 MVP2 DB와 반복 기동에서도 같은 결과가 나도록 모든 변경을 존재 여부 기준으로 실행한다.

SET @mvp2_add_last_login_at = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'members'
              AND column_name = 'last_login_at'
        ),
        'SELECT 1',
        'ALTER TABLE members ADD COLUMN last_login_at DATETIME(6) NULL'
    )
);
PREPARE mvp2_add_last_login_at_statement FROM @mvp2_add_last_login_at;
EXECUTE mvp2_add_last_login_at_statement;
DEALLOCATE PREPARE mvp2_add_last_login_at_statement;

UPDATE members
SET last_login_at = COALESCE(last_login_at, updated_at, created_at, CURRENT_TIMESTAMP(6))
WHERE last_login_at IS NULL;

-- last_login_at은 members.nickname/password_hash 기반의 현재 AuthService가 쓰지 않는
-- 레거시 컬럼이라 NOT NULL로 강제하지 않는다. NOT NULL로 강제하면 이 컬럼을 채우지 않는
-- 현재 INSERT(JdbcMemberRepository.save)가 기본 스키마·팀 RDS 양쪽에서 실패한다.

SET @mvp2_add_road_address = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'properties'
              AND column_name = 'road_address'
        ),
        'SELECT 1',
        'ALTER TABLE properties ADD COLUMN road_address VARCHAR(255) NULL'
    )
);
PREPARE mvp2_add_road_address_statement FROM @mvp2_add_road_address;
EXECUTE mvp2_add_road_address_statement;
DEALLOCATE PREPARE mvp2_add_road_address_statement;

SET @mvp2_add_jibun_address = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'properties'
              AND column_name = 'jibun_address'
        ),
        'SELECT 1',
        'ALTER TABLE properties ADD COLUMN jibun_address VARCHAR(255) NULL'
    )
);
PREPARE mvp2_add_jibun_address_statement FROM @mvp2_add_jibun_address;
EXECUTE mvp2_add_jibun_address_statement;
DEALLOCATE PREPARE mvp2_add_jibun_address_statement;

SET @mvp2_add_latitude = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'properties'
              AND column_name = 'latitude'
        ),
        'SELECT 1',
        'ALTER TABLE properties ADD COLUMN latitude DECIMAL(10, 7) NULL'
    )
);
PREPARE mvp2_add_latitude_statement FROM @mvp2_add_latitude;
EXECUTE mvp2_add_latitude_statement;
DEALLOCATE PREPARE mvp2_add_latitude_statement;

SET @mvp2_add_longitude = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'properties'
              AND column_name = 'longitude'
        ),
        'SELECT 1',
        'ALTER TABLE properties ADD COLUMN longitude DECIMAL(11, 7) NULL'
    )
);
PREPARE mvp2_add_longitude_statement FROM @mvp2_add_longitude;
EXECUTE mvp2_add_longitude_statement;
DEALLOCATE PREPARE mvp2_add_longitude_statement;

SET @mvp2_add_discovery_source = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'properties'
              AND column_name = 'discovery_source'
        ),
        'SELECT 1',
        'ALTER TABLE properties ADD COLUMN discovery_source VARCHAR(500) NULL'
    )
);
PREPARE mvp2_add_discovery_source_statement FROM @mvp2_add_discovery_source;
EXECUTE mvp2_add_discovery_source_statement;
DEALLOCATE PREPARE mvp2_add_discovery_source_statement;

-- 신규 통합 스키마는 discovery_source를 properties가 아니라 property_details에 둔다(007 참고).
-- 위 가드는 팀 Flyway V11 RDS처럼 properties.discovery_source가 이미 있던 환경과의 호환을 위한 것이다.

SET @mvp2_add_updated_at = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'properties'
              AND column_name = 'updated_at'
        ),
        'SELECT 1',
        'ALTER TABLE properties ADD COLUMN updated_at DATETIME(6) NULL'
    )
);
PREPARE mvp2_add_updated_at_statement FROM @mvp2_add_updated_at;
EXECUTE mvp2_add_updated_at_statement;
DEALLOCATE PREPARE mvp2_add_updated_at_statement;

SET @mvp2_add_last_activity_at = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'properties'
              AND column_name = 'last_activity_at'
        ),
        'SELECT 1',
        'ALTER TABLE properties ADD COLUMN last_activity_at DATETIME(6) NULL'
    )
);
PREPARE mvp2_add_last_activity_at_statement FROM @mvp2_add_last_activity_at;
EXECUTE mvp2_add_last_activity_at_statement;
DEALLOCATE PREPARE mvp2_add_last_activity_at_statement;

-- 새 통합 스키마(001-schema.sql)는 properties.updated_at/last_activity_at을 두지 않는다.
-- 위 가드는 팀 Flyway V11 RDS처럼 이미 두 컬럼이 있던 환경과의 호환을 위한 것이며,
-- 신규 통합 스키마에서는 이 두 컬럼이 추가만 되고 애플리케이션 코드는 더 이상 참조하지 않는다.

UPDATE properties
SET deposit_amount = COALESCE(deposit_amount, 0),
    monthly_rent_amount = COALESCE(monthly_rent_amount, 0),
    discovery_source = COALESCE(discovery_source, ''),
    created_at = COALESCE(created_at, CURRENT_TIMESTAMP(6)),
    updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP(6)),
    last_activity_at = COALESCE(last_activity_at, updated_at, created_at, CURRENT_TIMESTAMP(6));

-- updated_at·last_activity_at은 JdbcPropertyRepository가 쓰지 않는 레거시 컬럼이라
-- NOT NULL로 강제하지 않는다(위 last_login_at과 같은 이유).
ALTER TABLE properties
    MODIFY COLUMN deposit_amount BIGINT UNSIGNED NOT NULL DEFAULT 0,
    MODIFY COLUMN monthly_rent_amount BIGINT UNSIGNED NOT NULL DEFAULT 0,
    MODIFY COLUMN discovery_source VARCHAR(500) NOT NULL DEFAULT '',
    MODIFY COLUMN created_at DATETIME(6) NOT NULL;

SET @mvp2_rename_memo_column = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'property_memo_items'
              AND column_name = 'system_memo_item_id'
        ),
        'SELECT 1',
        IF(
            EXISTS(
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = 'property_memo_items'
                  AND column_name = 'system_meno_id'
            ),
            'ALTER TABLE property_memo_items RENAME COLUMN system_meno_id TO system_memo_item_id',
            'SELECT 1'
        )
    )
);
PREPARE mvp2_rename_memo_column_statement FROM @mvp2_rename_memo_column;
EXECUTE mvp2_rename_memo_column_statement;
DEALLOCATE PREPARE mvp2_rename_memo_column_statement;

-- 신규 통합 스키마는 system_memo_items 테이블 자체를 만들지 않는다(구조화 메모 폐기, 006 참고).
-- 팀 Flyway V11 RDS처럼 이 테이블이 아직 있는 환경에서만 시드를 보강한다.

SET @mvp2_seed_system_memo_items = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
              AND table_name = 'system_memo_items'
        ),
        "INSERT INTO system_memo_items (id, label, display_order, deleted_at) VALUES (1, '입주 가능일', 1, NULL), (2, '방 옵션', 2, NULL), (3, '관리비 및 공과금', 3, NULL), (4, '방문 일정', 4, NULL) AS new ON DUPLICATE KEY UPDATE label = new.label, display_order = new.display_order, deleted_at = NULL",
        'SELECT 1'
    )
);
PREPARE mvp2_seed_system_memo_items_statement FROM @mvp2_seed_system_memo_items;
EXECUTE mvp2_seed_system_memo_items_statement;
DEALLOCATE PREPARE mvp2_seed_system_memo_items_statement;

SET @mvp2_deactivate_system_memo_items = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
              AND table_name = 'system_memo_items'
        ),
        'UPDATE system_memo_items SET deleted_at = COALESCE(deleted_at, CURRENT_TIMESTAMP(6)) WHERE id NOT IN (1, 2, 3, 4)',
        'SELECT 1'
    )
);
PREPARE mvp2_deactivate_system_memo_items_statement FROM @mvp2_deactivate_system_memo_items;
EXECUTE mvp2_deactivate_system_memo_items_statement;
DEALLOCATE PREPARE mvp2_deactivate_system_memo_items_statement;

SET @mvp2_add_property_photo_pair_unique = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = 'property_photos'
              AND index_name = 'uk_property_photos_property_id'
        ),
        'SELECT 1',
        'ALTER TABLE property_photos ADD CONSTRAINT uk_property_photos_property_id UNIQUE (property_id, id)'
    )
);
PREPARE mvp2_add_property_photo_pair_unique_statement FROM @mvp2_add_property_photo_pair_unique;
EXECUTE mvp2_add_property_photo_pair_unique_statement;
DEALLOCATE PREPARE mvp2_add_property_photo_pair_unique_statement;

SET @mvp2_add_representative_unique = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = 'main_property_photos'
              AND index_name = 'uk_main_property_photos_property'
        ),
        'SELECT 1',
        'ALTER TABLE main_property_photos ADD CONSTRAINT uk_main_property_photos_property UNIQUE (property_id)'
    )
);
PREPARE mvp2_add_representative_unique_statement FROM @mvp2_add_representative_unique;
EXECUTE mvp2_add_representative_unique_statement;
DEALLOCATE PREPARE mvp2_add_representative_unique_statement;

SET @mvp2_add_representative_owner_fk = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.referential_constraints
            WHERE constraint_schema = DATABASE()
              AND table_name = 'main_property_photos'
              AND constraint_name = 'fk_main_property_photos_photo_owner'
        ),
        'SELECT 1',
        'ALTER TABLE main_property_photos ADD CONSTRAINT fk_main_property_photos_photo_owner FOREIGN KEY (property_id, property_photos_id) REFERENCES property_photos (property_id, id)'
    )
);
PREPARE mvp2_add_representative_owner_fk_statement FROM @mvp2_add_representative_owner_fk;
EXECUTE mvp2_add_representative_owner_fk_statement;
DEALLOCATE PREPARE mvp2_add_representative_owner_fk_statement;

SET @mvp2_add_location_pair_check = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.table_constraints
            WHERE constraint_schema = DATABASE()
              AND table_name = 'properties'
              AND constraint_name = 'ck_properties_location_pair'
        ),
        'SELECT 1',
        'ALTER TABLE properties ADD CONSTRAINT ck_properties_location_pair CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL))'
    )
);
PREPARE mvp2_add_location_pair_check_statement FROM @mvp2_add_location_pair_check;
EXECUTE mvp2_add_location_pair_check_statement;
DEALLOCATE PREPARE mvp2_add_location_pair_check_statement;

SET @mvp2_add_latitude_check = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.table_constraints
            WHERE constraint_schema = DATABASE()
              AND table_name = 'properties'
              AND constraint_name = 'ck_properties_latitude'
        ),
        'SELECT 1',
        'ALTER TABLE properties ADD CONSTRAINT ck_properties_latitude CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90)'
    )
);
PREPARE mvp2_add_latitude_check_statement FROM @mvp2_add_latitude_check;
EXECUTE mvp2_add_latitude_check_statement;
DEALLOCATE PREPARE mvp2_add_latitude_check_statement;

SET @mvp2_add_longitude_check = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.table_constraints
            WHERE constraint_schema = DATABASE()
              AND table_name = 'properties'
              AND constraint_name = 'ck_properties_longitude'
        ),
        'SELECT 1',
        'ALTER TABLE properties ADD CONSTRAINT ck_properties_longitude CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)'
    )
);
PREPARE mvp2_add_longitude_check_statement FROM @mvp2_add_longitude_check;
EXECUTE mvp2_add_longitude_check_statement;
DEALLOCATE PREPARE mvp2_add_longitude_check_statement;
