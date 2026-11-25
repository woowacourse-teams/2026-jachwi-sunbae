-- 상태와 메모는 독립적으로 저장하므로 버전도 분리한다. 기존 기록의 값은 보존한다.
ALTER TABLE property_checklist_items
    ADD COLUMN status_version BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN memo_version BIGINT NOT NULL DEFAULT 0;
