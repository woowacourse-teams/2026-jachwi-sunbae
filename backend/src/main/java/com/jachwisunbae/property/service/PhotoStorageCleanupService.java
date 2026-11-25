package com.jachwisunbae.property.service;

import com.jachwisunbae.property.repository.PhotoStorageCleanupRepository;
import com.jachwisunbae.property.repository.PhotoStorageCleanupRepository.CleanupRequest;
import com.jachwisunbae.property.storage.PhotoStorage;
import java.time.Clock;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class PhotoStorageCleanupService {

    private static final Logger LOG = LoggerFactory.getLogger(PhotoStorageCleanupService.class);
    private final PhotoStorageCleanupRepository requests;
    private final PhotoStorage storage;
    private final Clock clock;
    private final TransactionTemplate independentTransaction;

    public PhotoStorageCleanupService(PhotoStorageCleanupRepository requests, PhotoStorage storage,
                                      Clock clock, PlatformTransactionManager transactionManager) {
        this.requests = requests;
        this.storage = storage;
        this.clock = clock;
        independentTransaction = new TransactionTemplate(transactionManager);
        independentTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    // 사진 트랜잭션을 시작하기 전에 커밋해, 같은 연결을 순차적으로 재사용할 수 있게 한다.
    public void prepareUpload(String key, String thumbnailKey) {
        LocalDateTime now = LocalDateTime.now(clock);
        independentTransaction.executeWithoutResult(status -> requests.save(key, thumbnailKey, now, now.plusHours(1)));
    }

    public void lockUpload(String key) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            throw new IllegalStateException("사진 파일 전송에는 활성 트랜잭션이 필요합니다.");
        }
        if (requests.lock(key).isEmpty()) {
            throw new IllegalStateException("사진 업로드 복구 기록을 확보하지 못했습니다.");
        }
    }

    public void completeUpload(String key) {
        requests.delete(key);
    }

    public void cleanSafely(String key) {
        // 외부 트랜잭션에 참여 중이면 잠금과 커넥션을 추가 점유하지 않고 영속 기록으로 다음 회차에 처리한다.
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            return;
        }
        try {
            independentTransaction.executeWithoutResult(status -> cleanLocked(key));
        } catch (RuntimeException exception) {
            LOG.warn("사진 파일 정리를 마치지 못해 영속 기록으로 재시도합니다. type={}",
                    exception.getClass().getSimpleName(), exception);
        }
    }

    public void discardUnstarted(String key) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            return;
        }
        try {
            independentTransaction.executeWithoutResult(status -> requests.delete(key));
        } catch (RuntimeException exception) {
            LOG.warn("전송하지 않은 사진의 복구 기록은 다음 정리 회차에 제거합니다. type={}",
                    exception.getClass().getSimpleName(), exception);
        }
    }

    public int processDue() {
        var keys = requests.findDueKeys(LocalDateTime.now(clock), 20);
        keys.forEach(this::cleanSafely);
        var expiredPhotos = requests.findExpiredPhotoIds(LocalDateTime.now(clock), 20);
        expiredPhotos.forEach(photoId -> {
            try {
                independentTransaction.executeWithoutResult(status -> purgeExpiredPhoto(photoId));
            } catch (RuntimeException exception) {
                LOG.warn("보관 기간이 지난 사진 파일 파기를 재시도합니다. photoId={}, type={}",
                        photoId, exception.getClass().getSimpleName(), exception);
            }
        });
        return keys.size() + expiredPhotos.size();
    }

    private void purgeExpiredPhoto(long photoId) {
        var photo = requests.lockExpiredPhoto(photoId, LocalDateTime.now(clock));
        if (photo.isEmpty()) {
            return;
        }
        try {
            storage.delete(photo.get().storageKey());
            if (photo.get().thumbnailKey() != null) {
                storage.delete(photo.get().thumbnailKey());
            }
            requests.markPurged(photoId, LocalDateTime.now(clock));
        } catch (RuntimeException exception) {
            requests.retryPurge(photoId, LocalDateTime.now(clock).plusMinutes(5));
            LOG.warn("보관 기간이 지난 사진 파일 파기를 재예약했습니다. photoId={}, type={}",
                    photoId, exception.getClass().getSimpleName(), exception);
        }
    }

    private void cleanLocked(String key) {
        var request = requests.lock(key);
        if (request.isEmpty()) {
            return;
        }
        CleanupRequest cleanup = request.get();
        // 커밋 응답을 잃었어도 DB에서 참조하는 파일은 지우지 않는다. 보관 중인 논리 삭제 사진도 포함한다.
        try {
            deleteUnreferenced(cleanup.storageKey());
            if (cleanup.thumbnailKey() != null) {
                deleteUnreferenced(cleanup.thumbnailKey());
            }
            requests.delete(key);
        } catch (RuntimeException exception) {
            int attempts = cleanup.attempts() == Integer.MAX_VALUE ? Integer.MAX_VALUE : cleanup.attempts() + 1;
            long minutes = Math.min(1L << Math.min(attempts - 1, 10), 720);
            requests.reschedule(cleanup.id(), attempts, LocalDateTime.now(clock).plusMinutes(minutes));
            LOG.warn("사진 파일 정리를 재예약했습니다. cleanupId={}, attempts={}, type={}", cleanup.id(), attempts,
                    exception.getClass().getSimpleName(), exception);
        }
    }

    private void deleteUnreferenced(String key) {
        if (!requests.isReferenced(key)) {
            storage.delete(key);
        }
    }
}
