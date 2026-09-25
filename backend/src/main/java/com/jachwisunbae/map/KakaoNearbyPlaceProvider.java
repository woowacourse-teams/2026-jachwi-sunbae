package com.jachwisunbae.map;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "map.nearby.provider", havingValue = "kakao")
public class KakaoNearbyPlaceProvider implements NearbyPlaceProvider {

    // 캐시 없이 요청마다 호출하므로 카테고리당 호출 수를 제한한다.
    private static final int MAX_PAGE_COUNT = 3;

    private final KakaoPlaceClient client;

    public KakaoNearbyPlaceProvider(KakaoPlaceClient client) {
        this.client = client;
    }

    @Override
    public List<NearbyPlace> nearby(BigDecimal latitude, BigDecimal longitude, int radius,
                                    Set<MapCategory> categories) {
        Map<String, NearbyPlace> unique = new LinkedHashMap<>();
        for (MapCategory category : categories) {
            appendCategory(unique, category, latitude, longitude, radius);
        }
        return List.copyOf(unique.values());
    }

    private void appendCategory(Map<String, NearbyPlace> unique, MapCategory category,
                                BigDecimal latitude, BigDecimal longitude, int radius) {
        for (int page = 1; page <= MAX_PAGE_COUNT; page++) {
            KakaoCategorySearchResponse response =
                    client.searchCategory(categoryCode(category), latitude, longitude, radius, page);
            for (KakaoCategorySearchResponse.Document document : response.documents()) {
                NearbyPlace place = place(document, category);
                unique.putIfAbsent(place.providerPlaceId(), place);
            }
            if (response.end()) {
                return;
            }
        }
    }

    private NearbyPlace place(KakaoCategorySearchResponse.Document document, MapCategory category) {
        return new NearbyPlace("kakao:" + orEmpty(document.id()),
                orEmpty(document.placeName()),
                category,
                document.roadAddressName() == null ? orEmpty(document.addressName()) : document.roadAddressName(),
                document.latitude() == null ? BigDecimal.ZERO : document.latitude(),
                document.longitude() == null ? BigDecimal.ZERO : document.longitude(),
                document.distance() == null ? 0 : document.distance());
    }

    private String categoryCode(MapCategory category) {
        return switch (category) {
            case HOSPITAL -> "HP8";
            case TRANSPORT -> "SW8";
            case SCHOOL -> "SC4";
            case CONVENIENCE -> "CS2";
            case AGENCY -> "AG2";
        };
    }

    private String orEmpty(String value) {
        return value == null ? "" : value;
    }
}
