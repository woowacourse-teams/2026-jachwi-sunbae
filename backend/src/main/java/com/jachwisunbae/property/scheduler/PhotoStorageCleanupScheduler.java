package com.jachwisunbae.property.scheduler;

import com.jachwisunbae.property.service.PhotoStorageCleanupService;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "photo.cleanup.enabled", havingValue = "true")
public class PhotoStorageCleanupScheduler {

    private static final Logger LOG = LoggerFactory.getLogger(PhotoStorageCleanupScheduler.class);
    private final PhotoStorageCleanupService service;

    public PhotoStorageCleanupScheduler(PhotoStorageCleanupService service) {
        this.service = service;
    }

    @Scheduled(initialDelay = 1, fixedDelay = 1, timeUnit = TimeUnit.MINUTES)
    public void clean() {
        try {
            service.processDue();
        } catch (RuntimeException exception) {
            LOG.warn("사진 파일 정리 배치를 다음 회차에 다시 실행합니다. type={}",
                    exception.getClass().getSimpleName(), exception);
        }
    }
}
