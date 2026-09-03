-- 매물 부가정보(property_details)와 방 옵션·관리비 포함 공과금(M:N) 테이블은
-- 통합 스키마에서 새로 추가됐다. 리팩터링 이전 볼륨·RDS는 이 테이블들이 없으므로
-- 애플리케이션이 부가정보를 저장·조회하려면 먼저 존재를 보장해야 한다.
-- 정의는 db/init/001-schema.sql과 동일하게 유지한다.

CREATE TABLE IF NOT EXISTS property_details (
    property_id BIGINT UNSIGNED PRIMARY KEY,
    available_move_in_date DATE NULL,
    maintenance_fee_amount BIGINT UNSIGNED NOT NULL DEFAULT 0,
    visit_scheduled_at DATETIME(6) NULL,
    discovery_source VARCHAR(500) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_property_details_property FOREIGN KEY (property_id) REFERENCES properties (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_room_options (
    property_id BIGINT UNSIGNED NOT NULL,
    option_code VARCHAR(30) NOT NULL,
    PRIMARY KEY (property_id, option_code),
    CONSTRAINT fk_property_room_options_property FOREIGN KEY (property_id) REFERENCES properties (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_utility_options (
    property_id BIGINT UNSIGNED NOT NULL,
    utility_code VARCHAR(30) NOT NULL,
    PRIMARY KEY (property_id, utility_code),
    CONSTRAINT fk_property_utility_options_property FOREIGN KEY (property_id) REFERENCES properties (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
