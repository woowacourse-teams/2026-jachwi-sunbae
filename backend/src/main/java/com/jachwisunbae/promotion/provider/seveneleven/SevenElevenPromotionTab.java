package com.jachwisunbae.promotion.provider.seveneleven;

enum SevenElevenPromotionTab {
    ONE_PLUS_ONE("1", "1+1", 10),
    TWO_PLUS_ONE("2", "2+1", 10),
    GIFT("3", "증정행사", 3),
    SALE("4", "할인행사", 10);

    private final String code;
    private final String title;
    private final int pageSize;

    SevenElevenPromotionTab(final String code, final String title, final int pageSize) {
        this.code = code;
        this.title = title;
        this.pageSize = pageSize;
    }

    String code() {
        return code;
    }

    String title() {
        return title;
    }

    int pageSize() {
        return pageSize;
    }
}
