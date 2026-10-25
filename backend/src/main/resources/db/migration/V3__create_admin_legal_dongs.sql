-- 행정동과 관할 법정동의 연결 (행정안전부 행정기관·관할구역 연계표 KIKmix)
-- 행정동 코드는 admin_dongs와 같은 통계청 행정동 코드(8자리)로 바꿔 저장한다. 생활권 동네 월세 시세를 계산할 때 쓴다.
-- 다시 적재할 때 모두 비우고 새로 채운다.
CREATE TABLE IF NOT EXISTS admin_legal_dongs (
    admin_dong_code VARCHAR(10) NOT NULL,
    legal_dong_code CHAR(10) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    legal_dong_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (admin_dong_code, legal_dong_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
