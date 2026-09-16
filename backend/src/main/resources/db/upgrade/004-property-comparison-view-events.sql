-- 비교 화면 진입 시점의 회원과 보유 매물 수를 실험 이벤트로 보존한다.
-- 기존 회원과 매물 데이터는 변경하지 않고, 반복 기동에서도 같은 테이블을 유지한다.

CREATE TABLE IF NOT EXISTS property_comparison_view_events
(
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    member_id      BIGINT            NOT NULL,
    property_count SMALLINT UNSIGNED NOT NULL,
    viewed_at      DATETIME(6)       NOT NULL,
    CONSTRAINT fk_property_comparison_view_events_member
        FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE,
    CONSTRAINT ck_property_comparison_view_events_property_count
        CHECK (property_count BETWEEN 0 AND 30),
    INDEX idx_property_comparison_view_events_member_viewed (member_id, viewed_at, id),
    INDEX idx_property_comparison_view_events_count_viewed (property_count, viewed_at, id)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
