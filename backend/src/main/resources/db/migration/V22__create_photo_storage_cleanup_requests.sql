-- 파일 업로드 전에 독립 커밋하고, 사진 메타데이터와 함께 제거하는 복구 기록이다.
CREATE TABLE photo_storage_cleanup_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    storage_key VARCHAR(512) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    thumbnail_storage_key VARCHAR(512) CHARACTER SET ascii COLLATE ascii_bin NULL,
    attempts INT NOT NULL DEFAULT 0,
    next_attempt_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT uk_photo_storage_cleanup_key UNIQUE (storage_key),
    INDEX idx_photo_storage_cleanup_due (next_attempt_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 매물·회원 삭제 후 90일이 지난 파일의 파기 완료와 재시도 시각을 기록한다. 사진 메타데이터는 유지한다.
ALTER TABLE property_photos
    ADD COLUMN storage_purged_at DATETIME(6) NULL,
    ADD COLUMN storage_purge_next_attempt_at DATETIME(6) NULL,
    ADD INDEX idx_property_photos_thumbnail_storage_key (thumbnail_storage_key);
