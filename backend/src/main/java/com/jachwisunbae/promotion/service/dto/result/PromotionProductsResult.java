package com.jachwisunbae.promotion.service.dto.result;

import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import java.time.LocalDateTime;
import java.util.List;

public record PromotionProductsResult(ConvenienceBrand brand, LocalDateTime collectedAt,
                                      List<PromotionProduct> products) {

    public PromotionProductsResult {
        products = List.copyOf(products);
    }
}
