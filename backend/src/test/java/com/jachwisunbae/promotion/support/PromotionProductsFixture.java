package com.jachwisunbae.promotion.support;

import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.ProductCategory;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import com.jachwisunbae.promotion.domain.PromotionType;
import com.jachwisunbae.promotion.provider.PromotionFetcher;
import java.util.List;
import java.util.function.Supplier;

public final class PromotionProductsFixture {

    private PromotionProductsFixture() {
    }

    public static PromotionFetcher fetcher(final ConvenienceBrand brand,
                                           final Supplier<List<PromotionProduct>> products) {
        return new PromotionFetcher() {
            @Override
            public ConvenienceBrand brand() {
                return brand;
            }

            @Override
            public List<PromotionProduct> fetch() {
                return products.get();
            }
        };
    }

    public static PromotionProduct product(final String name) {
        return new PromotionProduct(ConvenienceBrand.EMART24, name, 3000, "https://example.com/product.jpg",
                ProductCategory.MEAL, PromotionType.ONE_PLUS_ONE);
    }

    // 실제 이마트24 전체 수집 결과가 아닌 로컬 저장 학습용 데이터다.
    public static List<PromotionProduct> sample() {
        PromotionProduct meal = product("검증용 김밥");
        return List.of(meal, meal,
                new PromotionProduct(ConvenienceBrand.EMART24, "검증용 과자", 2000,
                        "https://example.com/snack.jpg", ProductCategory.SNACK, PromotionType.TWO_PLUS_ONE),
                new PromotionProduct(ConvenienceBrand.EMART24, "검증용 음료", 1500,
                        "https://example.com/drink.jpg", ProductCategory.BEVERAGE, PromotionType.SALE),
                new PromotionProduct(ConvenienceBrand.EMART24, "검증용 음료", 1500,
                        "https://example.com/drink.jpg", ProductCategory.BEVERAGE, PromotionType.PICK_AND_MIX),
                new PromotionProduct(ConvenienceBrand.EMART24, "검증용 음료", 1000,
                        "https://example.com/drink.jpg", ProductCategory.BEVERAGE, PromotionType.SALE),
                new PromotionProduct(ConvenienceBrand.EMART24, "검증용 생활용품", 5000,
                        "https://example.com/household.jpg", ProductCategory.HOUSEHOLD_GOODS, PromotionType.THREE_PLUS_ONE));
    }
}
