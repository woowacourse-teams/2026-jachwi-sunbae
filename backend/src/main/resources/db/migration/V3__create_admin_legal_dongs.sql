-- 행정동과 관할 법정동의 연결 (행정안전부 행정기관·관할구역 연계표 KIKmix)
-- 행정동 코드는 admin_dongs와 같은 통계청 행정동 코드(8자리)로 바꿔 저장한다. 생활권 동네 월세 시세를 계산할 때 쓴다.
-- 다시 적재할 때 모두 비우고 새로 채운다.
CREATE TABLE IF NOT EXISTS admin_legal_dongs (
    admin_dong_code VARCHAR(10) NOT NULL,
    legal_dong_code CHAR(10) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    legal_dong_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (admin_dong_code, legal_dong_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 행정동별 월세 시세. 월세 거래를 적재하거나 관할 법정동 연결을 다시 적재할 때 함께 다시 계산한다.
-- 기간은 월세 수집본의 마지막 계약일부터 6개월 전까지이고, 거래가 5건 이상인 행정동만 저장한다.
-- legal_dong_names는 거래가 있던 관할 법정동 이름을 거래가 많은 순서로 쉼표로 이은 값이다.
CREATE TABLE IF NOT EXISTS admin_dong_rents (
    admin_dong_code VARCHAR(10) NOT NULL PRIMARY KEY,
    legal_dong_names VARCHAR(1000) NOT NULL,
    monthly_rent_krw BIGINT UNSIGNED NOT NULL,
    deposit_krw BIGINT UNSIGNED NOT NULL,
    transaction_count INT UNSIGNED NOT NULL,
    rent_start_date DATE NOT NULL,
    rent_end_date DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
