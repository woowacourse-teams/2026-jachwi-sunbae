-- 거리 메모의 카테고리다. 이 마이그레이션 전에 작성한 메모는 GENERAL로 채운다.
ALTER TABLE street_memos
    ADD COLUMN category VARCHAR(10) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'GENERAL'
        AFTER admin_dong_code,
    ADD CONSTRAINT chk_street_memos_category CHECK (category IN ('PLACE', 'STREET', 'GENERAL'));
