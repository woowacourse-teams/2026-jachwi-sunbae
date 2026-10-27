package com.jachwisunbae.promotion.service;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import com.jachwisunbae.promotion.provider.PromotionFetcher;
import com.jachwisunbae.promotion.repository.JdbcPromotionProductRepository;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PromotionCollectionService {

    private static final Logger LOG = LoggerFactory.getLogger(PromotionCollectionService.class);
    private static final ConvenienceBrand BRAND = ConvenienceBrand.EMART24;
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final PromotionFetcher fetcher;
    private final JdbcPromotionProductRepository repository;
    private final Clock clock;
    private final AtomicBoolean collecting = new AtomicBoolean();

    public PromotionCollectionService(final PromotionFetcher fetcher, final JdbcPromotionProductRepository repository,
                                      final Clock clock) {
        this.fetcher = fetcher;
        this.repository = repository;
        this.clock = clock;
    }

    // 호출자에게 트랜잭션이 있어도 HTTP 수집 중에는 중단한다. 저장할 때 Repository가 별도로 시작한다.
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void collect() {
        if (!collecting.compareAndSet(false, true)) {
            LOG.warn("promotion-collection-skipped brand={} reason=already-running", BRAND);
            return;
        }
        long startedAt = System.nanoTime();
        LOG.info("promotion-collection-start brand={}", BRAND);
        try {
            List<PromotionProduct> raw = fetcher.fetch();
            if (raw.isEmpty() || raw.stream().anyMatch(product -> product.brand() != BRAND)) {
                throw new UpstreamServiceException(ErrorCode.PROMOTION_RESPONSE_INVALID,
                        "이마트24 전체 수집 결과가 비어 있거나 다른 브랜드를 포함합니다. 기존 데이터를 유지합니다.");
            }
            // record의 모든 필드가 같은 경우에만 제거하고 최초 수집 순서를 유지한다.
            List<PromotionProduct> unique = List.copyOf(new LinkedHashSet<>(raw));
            int duplicateCount = raw.size() - unique.size();
            LOG.info("promotion-collection-counts brand={} rawCount={} duplicateCount={} uniqueCount={}",
                    BRAND, raw.size(), duplicateCount, unique.size());
            LocalDateTime collectedAt = now();
            int previousCount = repository.replaceByBrand(BRAND, unique, collectedAt);
            LOG.info("promotion-collection-end brand={} success=true previousCount={} storedCount={} collectedAt={} "
                            + "completedAt={} elapsedMillis={}",
                    BRAND, previousCount, unique.size(), collectedAt, now(), elapsedMillis(startedAt));
        } catch (RuntimeException exception) {
            // 경계에서 실패를 기록하고 그대로 전파한다. 데이터 오류를 빈 목록이나 성공으로 바꾸지 않는다.
            LOG.warn("promotion-collection-end brand={} success=false exceptionType={} elapsedMillis={}",
                    BRAND, exception.getClass().getSimpleName(), elapsedMillis(startedAt));
            throw exception;
        } finally {
            collecting.set(false);
        }
    }

    private LocalDateTime now() {
        return LocalDateTime.ofInstant(clock.instant(), KST);
    }

    private long elapsedMillis(final long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000;
    }
}
