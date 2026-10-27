package com.jachwisunbae.promotion.domain;

public enum ProductCategory {
    MEAL("간편식사"),
    SNACK("과자"),
    BEVERAGE("음료"),
    HOUSEHOLD_GOODS("생활용품"),
    UNKNOWN("미분류");

    private final String displayName;

    ProductCategory(final String displayName) {
        this.displayName = displayName;
    }

    public String displayName() {
        return displayName;
    }
}
