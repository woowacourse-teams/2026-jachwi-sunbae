package com.jachwisunbae.promotion.service;

import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import com.jachwisunbae.promotion.repository.JdbcPromotionProductRepository;
import com.jachwisunbae.promotion.service.dto.result.PromotionProductsResult;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PromotionQueryService {

    private final JdbcPromotionProductRepository repository;

    public PromotionQueryService(final JdbcPromotionProductRepository repository) {
        this.repository = repository;
    }

    // 전체 교체가 두 SELECT 사이에 완료되어도 목록과 수집 시각은 같은 스냅샷에서 읽는다.
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public PromotionProductsResult findByBrand(final ConvenienceBrand brand) {
        List<PromotionProduct> products = repository.findByBrand(brand);
        LocalDateTime collectedAt = repository.findLastCollectedAt(brand).orElse(null);
        return new PromotionProductsResult(brand, collectedAt, products);
    }
}
