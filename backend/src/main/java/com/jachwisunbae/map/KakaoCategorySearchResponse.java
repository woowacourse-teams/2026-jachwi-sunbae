package com.jachwisunbae.map;

import java.math.BigDecimal;
import java.util.List;

public record KakaoCategorySearchResponse(List<Document> documents, boolean end) {

    public record Document(String id, String placeName, String roadAddressName, String addressName,
                           BigDecimal latitude, BigDecimal longitude, Integer distance) {
    }
}
