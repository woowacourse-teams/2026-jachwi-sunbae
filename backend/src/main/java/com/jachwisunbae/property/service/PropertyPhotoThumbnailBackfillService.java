package com.jachwisunbae.property.service;

import com.jachwisunbae.property.entity.photo.PropertyPhoto;
import com.jachwisunbae.property.repository.PropertyPhotoRepository;
import com.jachwisunbae.property.service.dto.result.PhotoThumbnailBackfillResult;
import com.jachwisunbae.property.storage.PhotoStorage;
import com.jachwisunbae.property.storage.PhotoStorageKeyGenerator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

// 썸네일 도입 전에 올린 사진의 썸네일을 관리자 요청으로 나눠 만든다.
// 원본 다운로드와 생성은 트랜잭션 밖에서 끝내고, 전송·메타데이터 반영은 복구 기록을 잠근 뒤 수행한다.
@Service
public class PropertyPhotoThumbnailBackfillService {

    public static final int MAX_BATCH_SIZE = 50;
    private static final Logger LOG = LoggerFactory.getLogger(PropertyPhotoThumbnailBackfillService.class);

    private final PropertyPhotoRepository propertyPhotoRepository;
    private final PhotoStorage photoStorage;
    private final PhotoStorageKeyGenerator storageKeyGenerator;
    private final PhotoThumbnailGenerator thumbnailGenerator;
    private final TransactionTemplate transaction;
    private final PhotoStorageCleanupService cleanup;

    public PropertyPhotoThumbnailBackfillService(final PropertyPhotoRepository propertyPhotoRepository,
                                                 final PhotoStorage photoStorage,
                                                 final PhotoStorageKeyGenerator storageKeyGenerator,
                                                 final PhotoThumbnailGenerator thumbnailGenerator,
                                                 final TransactionTemplate transaction,
                                                 final PhotoStorageCleanupService cleanup) {
        this.propertyPhotoRepository = propertyPhotoRepository;
        this.photoStorage = photoStorage;
        this.storageKeyGenerator = storageKeyGenerator;
        this.thumbnailGenerator = thumbnailGenerator;
        this.transaction = transaction;
        this.cleanup = cleanup;
    }

    public PhotoThumbnailBackfillResult backfill(final long afterPhotoId, final int batchSize) {
        int limit = Math.clamp(batchSize, 1, MAX_BATCH_SIZE);
        List<PropertyPhoto> photos = propertyPhotoRepository.findWithoutThumbnailAfter(afterPhotoId, limit);
        int created = 0;
        int skipped = 0;
        for (PropertyPhoto photo : photos) {
            if (createThumbnail(photo)) {
                created++;
            } else {
                skipped++;
            }
        }
        long lastPhotoId = photos.isEmpty() ? afterPhotoId : photos.getLast().getId();
        return new PhotoThumbnailBackfillResult(photos.size(), created, skipped, lastPhotoId, photos.size() == limit);
    }

    // 저장소 장애는 그대로 던져 관리자가 같은 위치부터 다시 요청하게 한다. 썸네일을 만들 수 없는 사진만 건너뛴다.
    private boolean createThumbnail(final PropertyPhoto photo) {
        Optional<byte[]> thumbnail = thumbnailGenerator.generate(photoStorage.download(photo.getStorageKey()));
        if (thumbnail.isEmpty()) {
            LOG.atInfo().addKeyValue("photo_id", photo.getId())
                    .log("썸네일을 만들 수 없는 사진이라 원본으로 대신합니다.");
            return false;
        }
        String thumbnailKey = storageKeyGenerator.thumbnailKeyOf(photo.getStorageKey());
        cleanup.prepareUpload(thumbnailKey, null);
        AtomicBoolean uploadStarted = new AtomicBoolean();
        try {
            boolean created = Boolean.TRUE.equals(transaction.execute(status -> {
                if (!propertyPhotoRepository.lockActiveProperty(photo.getPropertyId())) {
                    return false;
                }
                var current = propertyPhotoRepository.findByIdAndPropertyId(photo.getId(), photo.getPropertyId());
                if (current.isEmpty() || current.get().hasThumbnail()) {
                    return false;
                }
                cleanup.lockUpload(thumbnailKey);
                uploadStarted.set(true);
                photoStorage.upload(thumbnailKey, thumbnail.get(), PhotoThumbnailGenerator.CONTENT_TYPE);
                if (!propertyPhotoRepository.updateThumbnailStorageKey(photo.getId(), thumbnailKey)) {
                    status.setRollbackOnly();
                    return false;
                }
                cleanup.completeUpload(thumbnailKey);
                return true;
            }));
            if (!created) {
                if (uploadStarted.get()) {
                    cleanup.cleanSafely(thumbnailKey);
                } else {
                    cleanup.discardUnstarted(thumbnailKey);
                }
            }
            return created;
        } catch (RuntimeException exception) {
            if (uploadStarted.get()) {
                cleanup.cleanSafely(thumbnailKey);
            } else {
                cleanup.discardUnstarted(thumbnailKey);
            }
            throw exception;
        }
    }
}
