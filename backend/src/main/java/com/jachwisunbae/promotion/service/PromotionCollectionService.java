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
import java.util.EnumMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

// 브랜드별 행사상품을 전체 수집하고 중복을 제거한 뒤 해당 브랜드의 기존 목록을 교체한다.
@Service
public class PromotionCollectionService {

    private static final Logger LOG = LoggerFactory.getLogger(PromotionCollectionService.class);
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final Map<ConvenienceBrand, PromotionFetcher> fetchers = new EnumMap<>(ConvenienceBrand.class);
    private final JdbcPromotionProductRepository repository;
    private final Clock clock;

    public PromotionCollectionService(final List<PromotionFetcher> fetchers,
                                      final JdbcPromotionProductRepository repository, final Clock clock) {
        for (PromotionFetcher fetcher : fetchers) {
            if (this.fetchers.putIfAbsent(fetcher.brand(), fetcher) != null) {
                throw new IllegalArgumentException("같은 브랜드의 수집기가 중복됩니다. brand=" + fetcher.brand());
            }
        }
        this.repository = repository;
        this.clock = clock;
    }

    // 등록된 모든 브랜드를 차례로 수집한다. 한 브랜드가 실패해도 다음 브랜드를 수집한다.
    public void collect() {
        collectEach(this::collect);
    }

    // HTTP 수집은 트랜잭션 밖에서 하고, 저장만 Repository의 트랜잭션으로 교체한다.
    //fetcher.fetch()                      // HTTP 수집, 트랜잭션 밖
    // → 결과가 비었거나 다른 브랜드가 섞이면 UpstreamServiceException  // 기존 데이터 유지
    // → new LinkedHashSet<>(raw)          // record 6개 필드가 모두 같을 때만 제거, 처음 수집한 순서 유지
    // → repository.replaceByBrand(...)    // 3단계에서 정한 트랜잭션: DELETE + Batch Insert
    // → 성공 로그: rawCount · duplicateCount · storedCount · collectedAt · elapsedMillis
    // (실패하면 경고 로그에 exceptionType만 남기고 예외를 다시 던짐)
    public void collect(final ConvenienceBrand brand) {
        PromotionFetcher fetcher = fetchers.get(brand);
        if (fetcher == null) {
            throw new IllegalArgumentException("등록된 수집기가 없습니다. brand=" + brand);
        }
        long startedAt = System.nanoTime();
        LOG.info("promotion-collection-start brand={}", brand);
        try {
            List<PromotionProduct> raw = fetcher.fetch();
            if (raw.isEmpty() || raw.stream().anyMatch(product -> product.brand() != brand)) {
                throw new UpstreamServiceException(ErrorCode.PROMOTION_RESPONSE_INVALID,
                        "전체 수집 결과가 비어 있거나 다른 브랜드를 포함해 기존 데이터를 유지합니다. brand=" + brand);
            }
            // record의 모든 필드가 같은 항목만 제거하고 처음 수집한 순서를 유지한다.
            List<PromotionProduct> unique = List.copyOf(new LinkedHashSet<>(raw));
            LocalDateTime collectedAt = LocalDateTime.ofInstant(clock.instant(), KST);
            repository.replaceByBrand(brand, unique, collectedAt);
            LOG.info("promotion-collection-end brand={} success=true rawCount={} duplicateCount={} storedCount={} "
                            + "collectedAt={} elapsedMillis={}",
                    brand, raw.size(), raw.size() - unique.size(), unique.size(), collectedAt, elapsedMillis(startedAt));
        } catch (RuntimeException exception) {
            LOG.warn("promotion-collection-end brand={} success=false exceptionType={} elapsedMillis={}",
                    brand, exception.getClass().getSimpleName(), elapsedMillis(startedAt));
            throw exception;
        }
    }

    // 최초 배포처럼 저장된 목록이 없는 브랜드만 수집해, 재배포마다 전체 수집하지 않는다.
    public void collectIfEmpty() {
        collectEach(brand -> {
            if (repository.findLastCollectedAt(brand).isPresent()) {
                LOG.info("promotion-initial-collection-skipped brand={} reason=already-collected", brand);
                return;
            }
            collect(brand);
        });
    }

    // 브랜드마다 독립적으로 실행하고, 모두 시도한 뒤 첫 실패를 호출자에게 전파한다.
    private void collectEach(final Consumer<ConvenienceBrand> collection) {
        RuntimeException failure = null;
        for (ConvenienceBrand brand : fetchers.keySet()) {
            try {
                collection.accept(brand);
            } catch (RuntimeException exception) {
                if (failure == null) {
                    failure = exception;
                }
            }
        }
        if (failure != null) {
            throw failure;
        }
    }

    private long elapsedMillis(final long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000;
    }
}
