CREATE TABLE IF NOT EXISTS nickname_credentials
(
    member_id     BIGINT       NOT NULL,
    nickname      VARCHAR(100) NOT NULL,
    nickname_key  VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    password_hash VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NULL,
    created_at    DATETIME(6)  NOT NULL,
    updated_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (member_id),
    CONSTRAINT uk_nickname_credentials_key UNIQUE (nickname_key),
    CONSTRAINT fk_nickname_credentials_member
        FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'members' AND column_name = 'nickname'
    ),
    'SELECT 1',
    'ALTER TABLE members ADD COLUMN nickname VARCHAR(100) NULL'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'members' AND column_name = 'nickname_key'
    ),
    'SELECT 1',
    'ALTER TABLE members ADD COLUMN nickname_key VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL AFTER nickname'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'members' AND column_name = 'password_hash'
    ),
    'SELECT 1',
    'ALTER TABLE members ADD COLUMN password_hash VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NULL AFTER nickname_key'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'members' AND index_name = 'uk_members_nickname_key'
    ),
    'SELECT 1',
    'ALTER TABLE members ADD CONSTRAINT uk_members_nickname_key UNIQUE (nickname_key)'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'members' AND column_name = 'name'
    ),
    'SELECT 1',
    'ALTER TABLE members ADD COLUMN name VARCHAR(100) NULL AFTER email'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'address'
    ),
    'SELECT 1',
    'ALTER TABLE properties ADD COLUMN address VARCHAR(255) NULL'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'deleted_at'
    ),
    'SELECT 1',
    'ALTER TABLE properties ADD COLUMN deleted_at DATETIME(6) NULL'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'road_address'
    ),
    'SELECT 1',
    'ALTER TABLE properties ADD COLUMN road_address VARCHAR(255) NULL'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'jibun_address'
    ),
    'SELECT 1',
    'ALTER TABLE properties ADD COLUMN jibun_address VARCHAR(255) NULL'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'latitude'
    ),
    'SELECT 1',
    'ALTER TABLE properties ADD COLUMN latitude DECIMAL(10, 7) NULL'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'longitude'
    ),
    'SELECT 1',
    'ALTER TABLE properties ADD COLUMN longitude DECIMAL(11, 7) NULL'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'property_photos' AND column_name = 'deleted_at'
    ),
    'SELECT 1',
    'ALTER TABLE property_photos ADD COLUMN deleted_at DATETIME(6) NULL'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'user_checklists' AND column_name = 'deleted_at'
    ),
    'SELECT 1',
    'ALTER TABLE user_checklists ADD COLUMN deleted_at DATETIME(6) NULL'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'property_memo_items' AND column_name = 'system_memo_item_id'
    ),
    'SELECT 1',
    IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE() AND table_name = 'property_memo_items' AND column_name = 'system_meno_id'
        ),
        'ALTER TABLE property_memo_items RENAME COLUMN system_meno_id TO system_memo_item_id',
        'SELECT 1'
    )
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

CREATE TABLE IF NOT EXISTS property_details
(
    property_id              BIGINT         NOT NULL,
    available_move_in_date   DATE           NULL,
    maintenance_fee_amount   BIGINT UNSIGNED NULL,
    visit_scheduled_at       DATETIME(6)    NULL,
    discovery_source         VARCHAR(500)   NULL,
    created_at               DATETIME(6)    NOT NULL,
    PRIMARY KEY (property_id),
    CONSTRAINT fk_property_details_property
        FOREIGN KEY (property_id) REFERENCES properties (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'property_details' AND column_name = 'available_move_in_date'
    ),
    'SELECT 1',
    'ALTER TABLE property_details ADD COLUMN available_move_in_date DATE NULL'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'property_details' AND column_name = 'maintenance_fee_amount'
    ),
    'SELECT 1',
    'ALTER TABLE property_details ADD COLUMN maintenance_fee_amount BIGINT UNSIGNED NULL'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'property_details' AND column_name = 'visit_scheduled_at'
    ),
    'SELECT 1',
    'ALTER TABLE property_details ADD COLUMN visit_scheduled_at DATETIME(6) NULL'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'property_details' AND column_name = 'discovery_source'
    ),
    'SELECT 1',
    'ALTER TABLE property_details ADD COLUMN discovery_source VARCHAR(500) NULL'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'property_details' AND column_name = 'created_at'
    ),
    'SELECT 1',
    'ALTER TABLE property_details ADD COLUMN created_at DATETIME(6) NULL'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.referential_constraints
        WHERE constraint_schema = DATABASE()
          AND table_name = 'property_details'
          AND constraint_name = 'fk_property_details_property'
    ),
    'SELECT 1',
    'ALTER TABLE property_details ADD CONSTRAINT fk_property_details_property FOREIGN KEY (property_id) REFERENCES properties (id) ON DELETE CASCADE'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

CREATE TABLE IF NOT EXISTS property_room_options
(
    property_id BIGINT      NOT NULL,
    option_code VARCHAR(30) NOT NULL,
    PRIMARY KEY (property_id, option_code),
    CONSTRAINT fk_property_room_options_property
        FOREIGN KEY (property_id) REFERENCES properties (id) ON DELETE CASCADE,
    CONSTRAINT ck_property_room_options_code CHECK (
        option_code IN (
            'AIR_CONDITIONER', 'REFRIGERATOR', 'WASHING_MACHINE', 'SINK',
            'GAS_STOVE', 'MICROWAVE', 'SHOE_CABINET', 'WARDROBE', 'BED',
            'DESK', 'TV', 'INDUCTION'
        )
    )
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS property_utility_options
(
    property_id BIGINT      NOT NULL,
    utility_code VARCHAR(30) NOT NULL,
    PRIMARY KEY (property_id, utility_code),
    CONSTRAINT fk_property_utility_options_property
        FOREIGN KEY (property_id) REFERENCES properties (id) ON DELETE CASCADE,
    CONSTRAINT ck_property_utility_options_code CHECK (
        utility_code IN ('WATER', 'ELECTRICITY', 'GAS', 'INTERNET')
    )
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS member_checklist_preferences
(
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    member_id         BIGINT          NOT NULL,
    stage             VARCHAR(30)     NOT NULL,
    user_checklist_id BIGINT UNSIGNED NULL,
    created_at        DATETIME(6)     NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_member_checklist_preferences_member
        FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE,
    CONSTRAINT fk_member_checklist_preferences_checklist
        FOREIGN KEY (user_checklist_id) REFERENCES user_checklists (id) ON DELETE SET NULL,
    CONSTRAINT ck_member_checklist_preferences_stage
        CHECK (stage IN ('ON_SITE', 'PRE_CONTRACT')),
    INDEX idx_member_checklist_preferences_latest (member_id, stage, created_at DESC, id DESC)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS migration_backfill_failures
(
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    migration_version VARCHAR(50)   NOT NULL,
    source_table     VARCHAR(64)     NOT NULL,
    source_id        BIGINT          NOT NULL,
    target_table     VARCHAR(64)     NOT NULL,
    target_column    VARCHAR(64)     NOT NULL,
    raw_value        VARCHAR(2000)   NOT NULL,
    reason           VARCHAR(255)    NOT NULL,
    created_at       DATETIME(6)     NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_migration_backfill_failures_source
        UNIQUE (migration_version, source_table, source_id, target_column)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'properties'
          AND index_name = 'idx_properties_member_deleted_created'
    ),
    'SELECT 1',
    'ALTER TABLE properties ADD INDEX idx_properties_member_deleted_created (member_id, deleted_at, created_at DESC, id DESC)'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'property_photos'
          AND index_name = 'idx_property_photos_property_deleted_created'
    ),
    'SELECT 1',
    'ALTER TABLE property_photos ADD INDEX idx_property_photos_property_deleted_created (property_id, deleted_at, created_at, id)'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;

SET @v3_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'user_checklists'
          AND index_name = 'idx_user_checklists_member_stage_deleted'
    ),
    'SELECT 1',
    'ALTER TABLE user_checklists ADD INDEX idx_user_checklists_member_stage_deleted (member_id, stage, deleted_at, id)'
);
PREPARE v3_statement FROM @v3_sql;
EXECUTE v3_statement;
DEALLOCATE PREPARE v3_statement;
