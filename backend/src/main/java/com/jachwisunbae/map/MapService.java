package com.jachwisunbae.map;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class MapService {

    private static final Set<Integer> SUPPORTED_RADII = Set.of(500, 1000, 2000);
    private static final Logger LOG = LoggerFactory.getLogger(MapService.class);
    private final AddressProvider addressProvider;
    private final NearbyPlaceProvider nearbyPlaceProvider;
    private final Optional<BusStopProvider> busStopProvider;

    public MapService(AddressProvider addressProvider, NearbyPlaceProvider nearbyPlaceProvider,
                      Optional<BusStopProvider> busStopProvider) {
        this.addressProvider = addressProvider;
        this.nearbyPlaceProvider = nearbyPlaceProvider;
        this.busStopProvider = busStopProvider;
    }

    public List<MapAddress> geocode(String query) {
        if (query == null || query.isBlank() || query.length() > 200) {
            throw invalidQuery("주소 검색어는 1자 이상 200자 이하여야 합니다.");
        }
        return addressProvider.geocode(query.trim());
    }

    public MapAddress reverseGeocode(BigDecimal latitude, BigDecimal longitude) {
        validateCoordinates(latitude, longitude);
        return addressProvider.reverseGeocode(latitude, longitude);
    }

    public NearbyResponse nearby(BigDecimal latitude, BigDecimal longitude, int radius,
                                 Set<MapCategory> requestedCategories) {
        validateCoordinates(latitude, longitude);
        if (!SUPPORTED_RADII.contains(radius)) {
            throw invalidQuery("반경은 500m, 1km, 2km만 사용할 수 있습니다.");
        }
        Set<MapCategory> categories = categories(requestedCategories);
        List<NearbyPlace> places = findPlaces(latitude, longitude, radius, categories);
        Map<MapCategory, Integer> counts = new EnumMap<>(MapCategory.class);
        for (MapCategory category : MapCategory.values()) {
            counts.put(category, 0);
        }
        places.forEach(place -> counts.computeIfPresent(place.category(), (category, count) -> count + 1));
        return new NearbyResponse(new NearbyResponse.Center(latitude, longitude), radius,
                Map.copyOf(counts), places);
    }

    private Set<MapCategory> categories(Set<MapCategory> requestedCategories) {
        EnumSet<MapCategory> categories = EnumSet.noneOf(MapCategory.class);
        if (requestedCategories != null) {
            requestedCategories.stream()
                    .filter(Objects::nonNull)
                    .forEach(categories::add);
        }
        return categories.isEmpty() ? EnumSet.allOf(MapCategory.class) : categories;
    }

    private List<NearbyPlace> findPlaces(BigDecimal latitude, BigDecimal longitude, int radius,
                                         Set<MapCategory> categories) {
        List<NearbyPlace> places = nearbyPlaceProvider.nearby(latitude, longitude, radius, categories);
        if (!categories.contains(MapCategory.TRANSPORT) || busStopProvider.isEmpty()) {
            return places;
        }
        Map<String, NearbyPlace> unique = new LinkedHashMap<>();
        places.forEach(place -> unique.putIfAbsent(place.providerPlaceId(), place));
        try {
            busStopProvider.get().nearby(latitude, longitude, radius)
                    .forEach(place -> unique.putIfAbsent(place.providerPlaceId(), place));
        } catch (RuntimeException exception) {
            LOG.warn("TAGO 버스정류소 조회에 실패해 주변 시설 검색 결과만 반환합니다.", exception);
        }
        return List.copyOf(unique.values());
    }

    private void validateCoordinates(BigDecimal latitude, BigDecimal longitude) {
        if (latitude == null || longitude == null
                || latitude.compareTo(BigDecimal.valueOf(-90)) < 0
                || latitude.compareTo(BigDecimal.valueOf(90)) > 0
                || longitude.compareTo(BigDecimal.valueOf(-180)) < 0
                || longitude.compareTo(BigDecimal.valueOf(180)) > 0) {
            throw invalidQuery("위도와 경도 범위가 올바르지 않습니다.");
        }
    }

    private BusinessException invalidQuery(String message) {
        return new BusinessException(DomainErrorCode.MAP_QUERY_INVALID, message);
    }
}
