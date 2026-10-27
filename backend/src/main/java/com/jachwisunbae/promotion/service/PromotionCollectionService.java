package com.jachwisunbae.promotion.service;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import com.jachwisunbae.promotion.provider.PromotionFetcher;
import com.jachwisunbae.promotion.repository.JdbcPromotionProductRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PromotionCollectionService {

    private static final Logger LOG = LoggerFactory.getLogger(PromotionCollectionService.class);
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final List<PromotionFetcher> fetchers;
    private final JdbcPromotionProductRepository repository;
    private final Clock clock;
    private final Set<ConvenienceBrand> collecting = EnumSet.noneOf(ConvenienceBrand.class);
    private final Map<ConvenienceBrand, LocalDate> lastAttempted = new EnumMap<>(ConvenienceBrand.class);

    public PromotionCollectionService(final List<PromotionFetcher> fetchers, final JdbcPromotionProductRepository repository,
                                      final Clock clock) {
        this.fetchers = List.copyOf(fetchers);
        Set<ConvenienceBrand> brands = EnumSet.noneOf(ConvenienceBrand.class);
        for (PromotionFetcher fetcher : fetchers) {
            if (fetcher.brand() == null || !brands.add(fetcher.brand())) {
                throw new IllegalArgumentException("브랜드가 없거나 같은 브랜드의 수집기가 중복됩니다.");
            }
        }
        this.repository = repository;
        this.clock = clock;
    }

    // 호출자에게 트랜잭션이 있어도 HTTP 수집 중에는 중단한다. 저장할 때 Repository가 별도로 시작한다.
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void collect() {
        for (PromotionFetcher fetcher : fetchers) {
            try {
                collectFetcher(fetcher);
            } catch (RuntimeException exception) {
                // 앞 브랜드가 실패해도 다음 브랜드를 시도한다. 즉시 재시도하지 않는다.
                LOG.warn("promotion-brand-collection-failed brand={} exceptionType={}",
                        fetcher.brand(), exception.getClass().getSimpleName());
            }
        }
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void collect(final ConvenienceBrand brand) {
        PromotionFetcher fetcher = fetchers.stream().filter(candidate -> candidate.brand() == brand).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("등록된 수집기가 없습니다. brand=" + brand));
        collectFetcher(fetcher);
    }

    private void collectFetcher(final PromotionFetcher fetcher) {
        ConvenienceBrand brand = fetcher.brand();
        if (!begin(brand)) {
            return;
        }
        long startedAt = System.nanoTime();
        LOG.info("promotion-collection-start brand={}", brand);
        try {
            List<PromotionProduct> raw = fetcher.fetch();
            if (raw.isEmpty() || raw.stream().anyMatch(product -> product == null || product.brand() != brand)) {
                throw new UpstreamServiceException(ErrorCode.PROMOTION_RESPONSE_INVALID,
                        "전체 수집 결과가 비어 있거나 다른 브랜드를 포함합니다. brand=" + brand);
            }
            // record의 모든 필드가 같은 경우에만 제거하고 최초 수집 순서를 유지한다.
            List<PromotionProduct> unique = List.copyOf(new LinkedHashSet<>(raw));
            int duplicateCount = raw.size() - unique.size();
            LOG.info("promotion-collection-counts brand={} rawCount={} duplicateCount={} uniqueCount={}",
                    brand, raw.size(), duplicateCount, unique.size());
            LocalDateTime collectedAt = now();
            int previousCount = repository.replaceByBrand(brand, unique, collectedAt);
            LOG.info("promotion-collection-end brand={} success=true previousCount={} storedCount={} collectedAt={} "
                            + "completedAt={} elapsedMillis={}",
                    brand, previousCount, unique.size(), collectedAt, now(), elapsedMillis(startedAt));
        } catch (RuntimeException exception) {
            // 경계에서 실패를 기록하고 그대로 전파한다. 데이터 오류를 빈 목록이나 성공으로 바꾸지 않는다.
            LOG.warn("promotion-collection-end brand={} success=false exceptionType={} elapsedMillis={}",
                    brand, exception.getClass().getSimpleName(), elapsedMillis(startedAt));
            throw exception;
        } finally {
            end(brand);
        }
    }

    private synchronized boolean begin(final ConvenienceBrand brand) {
        if (collecting.contains(brand)) {
            LOG.warn("promotion-collection-skipped brand={} reason=already-running", brand);
            return false;
        }
        LocalDate today = now().toLocalDate();
        if (today.equals(lastAttempted.get(brand))) {
            LOG.warn("promotion-collection-skipped brand={} reason=already-attempted-today", brand);
            return false;
        }
        collecting.add(brand);
        lastAttempted.put(brand, today); // 실패해도 당일 재시도하지 않는다. JVM 재시작 간 보장은 별도다.
        return true;
    }

    private synchronized void end(final ConvenienceBrand brand) {
        collecting.remove(brand);
    }

    private LocalDateTime now() {
        return LocalDateTime.ofInstant(clock.instant(), KST);
    }

    private long elapsedMillis(final long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000;
    }
}
