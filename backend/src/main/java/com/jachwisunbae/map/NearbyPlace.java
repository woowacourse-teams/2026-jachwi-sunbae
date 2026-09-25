package com.jachwisunbae.map;

import java.math.BigDecimal;

public record NearbyPlace(String providerPlaceId, String name, MapCategory category,
                          String address, BigDecimal latitude, BigDecimal longitude,
                          int distanceMeters) {

    private static final BigDecimal MAX_LATITUDE = BigDecimal.valueOf(90);
    private static final BigDecimal MAX_LONGITUDE = BigDecimal.valueOf(180);

    public NearbyPlace {
        requireText(providerPlaceId, "주변 시설 ID가 필요합니다.");
        requireText(name, "주변 시설 이름이 필요합니다.");
        if (category == null) {
            throw new IllegalArgumentException("주변 시설 카테고리가 필요합니다.");
        }
        requireCoordinate(latitude, MAX_LATITUDE, "주변 시설 위도가 올바르지 않습니다.");
        requireCoordinate(longitude, MAX_LONGITUDE, "주변 시설 경도가 올바르지 않습니다.");
        if (distanceMeters < 0) {
            throw new IllegalArgumentException("주변 시설 거리는 0 이상이어야 합니다.");
        }
        address = address == null ? "" : address;
    }

    private static void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }

    private static void requireCoordinate(BigDecimal value, BigDecimal limit, String message) {
        if (value == null || value.abs().compareTo(limit) > 0) {
            throw new IllegalArgumentException(message);
        }
    }
}
