package com.jachwisunbae.promotion.collector;

import com.jachwisunbae.promotion.service.PromotionCollectionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "promotion.collection.enabled", havingValue = "true")
public class PromotionCollectionScheduler {

    private static final Logger LOG = LoggerFactory.getLogger(PromotionCollectionScheduler.class);

    private final PromotionCollectionService service;

    public PromotionCollectionScheduler(final PromotionCollectionService service) {
        this.service = service;
    }

    @Scheduled(cron = "0 0 4 * * *", zone = "Asia/Seoul")
    public void collect() {
        try {
            service.collect();
        } catch (RuntimeException exception) {
            LOG.warn("promotion-scheduled-collection-failed exceptionType={}", exception.getClass().getSimpleName());
        }
    }
}
