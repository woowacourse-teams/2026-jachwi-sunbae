package com.jachwisunbae.promotion.domain;

public enum PromotionType {
    ONE_PLUS_ONE("1+1"),
    TWO_PLUS_ONE("2+1"),
    THREE_PLUS_ONE("3+1"),
    SALE("세일"),
    PICK_AND_MIX("골라담기");

    private final String displayName;

    PromotionType(final String displayName) {
        this.displayName = displayName;
    }

    public String displayName() {
        return displayName;
    }
}
