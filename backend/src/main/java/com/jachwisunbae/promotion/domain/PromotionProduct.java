package com.jachwisunbae.promotion.domain;

import java.net.URI;

public record PromotionProduct(
        ConvenienceBrand brand,
        String name,
        int price,
        String imageUrl,
        ProductCategory category,
        PromotionType promotionType
) {

    public PromotionProduct {
        if (brand == null || category == null || promotionType == null) {
            throw new IllegalArgumentException("행사상품의 브랜드, 카테고리, 행사 유형이 필요합니다.");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("행사상품 이름이 필요합니다.");
        }
        if (price < 0) {
            throw new IllegalArgumentException("행사상품 가격은 0 이상이어야 합니다.");
        }
        if (imageUrl == null || imageUrl.isBlank()) {
            throw new IllegalArgumentException("행사상품 이미지 URL이 필요합니다.");
        }
        URI imageUri = URI.create(imageUrl);
        if (imageUri.getHost() == null
                || !("https".equalsIgnoreCase(imageUri.getScheme()) || "http".equalsIgnoreCase(imageUri.getScheme()))) {
            throw new IllegalArgumentException("행사상품 이미지 주소는 절대 HTTP URL이어야 합니다.");
        }
    }
}
