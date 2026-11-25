-- 선점 만료 후 이전 작업자의 완료·재예약이 새 작업자의 요청에 반영되지 않도록 선점 식별자를 저장한다.
-- 기존 요청과 구버전 INSERT는 NULL로 남고, 새 처리기가 선점할 때 UUID를 채운다.
ALTER TABLE oauth_unlink_requests
    ADD COLUMN claim_token CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL;
