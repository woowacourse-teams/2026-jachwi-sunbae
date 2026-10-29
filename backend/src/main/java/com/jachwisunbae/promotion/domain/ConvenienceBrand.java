package com.jachwisunbae.promotion.domain;

// 행사상품을 제공하는 편의점 브랜드와 공식 행사상품 페이지(출처)를 구분한다.
public enum ConvenienceBrand {
    EMART24("https://emart24.co.kr/goods/event"),
    SEVEN_ELEVEN("https://www.7-eleven.co.kr/product/presentList.asp");

    private final String sourceUrl;

    ConvenienceBrand(final String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }

    public String sourceUrl() {
        return sourceUrl;
    }
}
