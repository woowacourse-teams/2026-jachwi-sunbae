package com.jachwisunbae.promotion.support;

import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.ProductCategory;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import com.jachwisunbae.promotion.domain.PromotionType;

public final class PromotionProductsFixture {

    private PromotionProductsFixture() {
    }

    public static PromotionProduct product(final String name) {
        return product(ConvenienceBrand.EMART24, name);
    }

    public static PromotionProduct product(final ConvenienceBrand brand, final String name) {
        return new PromotionProduct(brand, name, 3000, "https://example.com/product.jpg",
                ProductCategory.MEAL, PromotionType.ONE_PLUS_ONE);
    }
}
