package com.jachwisunbae.map.provider.kakao;

import com.jachwisunbae.map.domain.NearbyPlace;
import com.jachwisunbae.map.provider.NearbyPlaceProvider;
import com.jachwisunbae.map.type.MapCategory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

//우리 서비스의 카테고리들을 카카오 장소 검색 API에 맞게 바꾸고,
// 카카오에서 여러 페이지를 조회한 뒤, 결과를 우리 도메인인 NearbyPlace로 변환해서 반환
@Component
@ConditionalOnProperty(name = "map.nearby.provider", havingValue = "kakao")
public class KakaoNearbyPlaceProvider implements NearbyPlaceProvider {

    // 캐시 없이 요청마다 호출하므로 카테고리당 호출 수를 제한한다.
    private static final int MAX_PAGE_COUNT = 3;
    private static final Logger LOG = LoggerFactory.getLogger(KakaoNearbyPlaceProvider.class);

    private final KakaoPlaceClient client;

    public KakaoNearbyPlaceProvider(KakaoPlaceClient client) {
        this.client = client;
    }

    @Override
    public List<NearbyPlace> nearby(BigDecimal latitude, BigDecimal longitude, int radius, Set<MapCategory> categories) {
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
                if (!hasRequiredFields(document)) {
                    LOG.warn("카카오 주변 시설 응답에 필수 값이 없어 제외합니다. category={}, id={}", category, document.id());
                    continue; // 데이터 하나가 이상하다고 전체를 실패시키지 않는다.
                }
                NearbyPlace place = place(document, category);
                unique.putIfAbsent(place.providerPlaceId(), place);
            }

            if (response.end()) {
                return;
            }
        }
    }

    private boolean hasRequiredFields(KakaoCategorySearchResponse.Document document) {
        return document.id() != null && document.placeName() != null
            && document.latitude() != null && document.longitude() != null && document.distance() != null;
    }

    private NearbyPlace place(KakaoCategorySearchResponse.Document document, MapCategory category) {
        return new NearbyPlace("kakao:" + document.id(),
            document.placeName(),
            category,
            //도로명 주소가 있으면 우선 사용
            document.roadAddressName() == null ? document.addressName() : document.roadAddressName(),
            document.latitude(),
            document.longitude(),
            document.distance());
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
}
