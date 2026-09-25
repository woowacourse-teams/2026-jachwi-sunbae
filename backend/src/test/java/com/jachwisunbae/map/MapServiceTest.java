package com.jachwisunbae.map;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class MapServiceTest {

    private static final BigDecimal LATITUDE = new BigDecimal("37.406");
    private static final BigDecimal LONGITUDE = new BigDecimal("127.088");
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-09-24T00:00:00Z"), ZoneOffset.UTC);

    private final NearbyPlace subway = place("kakao:1", "판교역", MapCategory.TRANSPORT);
    private final NearbyPlace hospital = place("kakao:2", "판교병원", MapCategory.HOSPITAL);
    private final NearbyPlace busStop = place("tago:31:1", "판교역 정류장", MapCategory.TRANSPORT);

    @Test
    @DisplayName("주변 시설과 버스정류장 결과를 합치고 중복을 제거한다")
    void transportSearchCombinesNearbyPlacesAndBusStops() {
        MapService service = service(Optional.of((latitude, longitude, radius) -> List.of(busStop, subway)));

        NearbyResponse response = service.nearby(LATITUDE, LONGITUDE, 500, EnumSet.allOf(MapCategory.class));

        assertThat(response.places()).containsExactly(subway, hospital, busStop);
        assertThat(response.counts())
                .containsEntry(MapCategory.TRANSPORT, 2)
                .containsEntry(MapCategory.HOSPITAL, 1)
                .containsEntry(MapCategory.SCHOOL, 0);
    }

    @Test
    @DisplayName("교통 카테고리가 없으면 버스정류장을 조회하지 않는다")
    void busStopsAreNotRequestedWithoutTransportCategory() {
        AtomicInteger busStopCalls = new AtomicInteger();
        MapService service = service(Optional.of((latitude, longitude, radius) -> {
            busStopCalls.incrementAndGet();
            return List.of(busStop);
        }));

        NearbyResponse response = service.nearby(LATITUDE, LONGITUDE, 500, EnumSet.of(MapCategory.HOSPITAL));

        assertThat(busStopCalls).hasValue(0);
        assertThat(response.places()).doesNotContain(busStop);
    }

    @Test
    @DisplayName("버스정류장 조회가 실패해도 기존 시설 결과를 반환한다")
    void busStopFailureKeepsNearbyPlaces() {
        MapService service = service(Optional.of((latitude, longitude, radius) -> {
            throw new IllegalStateException("TAGO 장애");
        }));

        NearbyResponse response = service.nearby(LATITUDE, LONGITUDE, 500, EnumSet.allOf(MapCategory.class));

        assertThat(response.places()).containsExactly(subway, hospital);
    }

    private MapService service(Optional<BusStopProvider> busStopProvider) {
        NearbyPlaceProvider nearbyPlaceProvider = (latitude, longitude, radius, categories) -> List.of(subway, hospital);
        return new MapService(new DemoAddressProvider(), nearbyPlaceProvider, busStopProvider, CLOCK, 600);
    }

    private static NearbyPlace place(String id, String name, MapCategory category) {
        return new NearbyPlace(id, name, category, "경기 성남시 분당구", LATITUDE, LONGITUDE, 100);
    }
}
