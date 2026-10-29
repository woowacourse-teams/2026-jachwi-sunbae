-- 배달 플랫폼의 브랜드별 할인정보. 운영자가 확인한 내용을 SQL로 직접 등록·수정한다.
-- 같은 플랫폼·브랜드에도 여러 할인행사가 있을 수 있어 (platform, brand_name)을 UNIQUE로 묶지 않는다.
CREATE TABLE delivery_discount_offers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    platform VARCHAR(20) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    brand_name VARCHAR(100) NOT NULL,
    discount_amount INT NOT NULL COMMENT '원 단위 할인금액',
    min_order_amount INT NULL COMMENT '원 단위 최소주문금액. 모르면 NULL',
    start_date DATE NULL COMMENT '행사 시작일. 모르면 NULL',
    end_date DATE NULL COMMENT '행사 종료일(당일 포함). 모르면 NULL',
    conditions VARCHAR(255) NULL COMMENT '추가 조건',
    last_verified_at DATETIME NOT NULL COMMENT '마지막으로 할인정보를 확인한 시각 (KST)',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    CONSTRAINT chk_delivery_discount_offers_platform CHECK (platform IN ('BAEMIN', 'COUPANG_EATS')),
    CONSTRAINT chk_delivery_discount_offers_discount_amount CHECK (discount_amount > 0),
    CONSTRAINT chk_delivery_discount_offers_min_order_amount CHECK (min_order_amount IS NULL OR min_order_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
