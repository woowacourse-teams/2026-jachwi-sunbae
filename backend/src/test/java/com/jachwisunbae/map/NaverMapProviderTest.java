package com.jachwisunbae.map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.queryParam;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriUtils;

class NaverMapProviderTest {

    private static final BigDecimal CENTER_LATITUDE = BigDecimal.valueOf(37.5665);
    private static final BigDecimal CENTER_LONGITUDE = BigDecimal.valueOf(126.978);

    private RestClient.Builder mapsBuilder;
    private RestClient.Builder searchBuilder;
    private MockRestServiceServer mapsServer;
    private MockRestServiceServer searchServer;

    @BeforeEach
    void setUp() {
        mapsBuilder = RestClient.builder().baseUrl("https://naveropenapi.apigw.ntruss.com");
        searchBuilder = RestClient.builder().baseUrl("https://naverapihub.apigw.ntruss.com");
        mapsServer = MockRestServiceServer.bindTo(mapsBuilder).build();
        searchServer = MockRestServiceServer.bindTo(searchBuilder).build();
    }

    @Test
    void reverseGeocodeBuildsFullRoadAndJibunAddress() {
        expectReverseGeocode();

        MapAddress address = provider().reverseGeocode(CENTER_LATITUDE, CENTER_LONGITUDE);

        assertThat(address.roadAddress()).isEqualTo("서울특별시 중구 세종대로 110");
        assertThat(address.jibunAddress()).isEqualTo("서울특별시 중구 태평로1가 31-3");
        mapsServer.verify();
    }

    @Test
    void nearbySearchesByCenterAddressAndDropsPlacesOutsideRadius() {
        expectReverseGeocode();
        expectLocalSearch("병원", """
                {"items": [
                  {"title": "<b>서울</b>의원", "roadAddress": "서울 중구 세종대로 112",
                   "address": "서울 중구 태평로1가 33", "mapx": "1269781000", "mapy": "375668000"},
                  {"title": "먼병원", "roadAddress": "경기 성남시 分당구", "address": "경기 성남시",
                   "mapx": "1273900000", "mapy": "373800000"}
                ]}
                """);

        List<NearbyPlace> places = provider().nearby(CENTER_LATITUDE, CENTER_LONGITUDE, 1000,
                Set.of(MapCategory.HOSPITAL));

        assertThat(places).hasSize(1);
        assertThat(places.getFirst()).satisfies(place -> {
            assertThat(place.name()).isEqualTo("서울의원");
            assertThat(place.category()).isEqualTo(MapCategory.HOSPITAL);
            assertThat(place.address()).isEqualTo("서울 중구 세종대로 112");
            assertThat(place.latitude()).isEqualByComparingTo("37.5668");
            assertThat(place.longitude()).isEqualByComparingTo("126.9781");
            assertThat(place.distanceMeters()).isLessThan(1000);
        });
        mapsServer.verify();
        searchServer.verify();
    }

    @Test
    void nearbyAcceptsUnscaledSearchCoordinates() {
        expectReverseGeocode();
        expectLocalSearch("편의점", """
                {"items": [
                  {"title": "시청편의점", "roadAddress": "서울 중구 세종대로 112",
                   "address": "서울 중구 태평로1가 33", "mapx": "126.9781", "mapy": "37.5668"}
                ]}
                """);

        List<NearbyPlace> places = provider().nearby(CENTER_LATITUDE, CENTER_LONGITUDE, 1000,
                Set.of(MapCategory.CONVENIENCE));

        assertThat(places).extracting(NearbyPlace::latitude).containsExactly(new BigDecimal("37.5668"));
        searchServer.verify();
    }

    @Test
    void transportCombinesLocalSearchAndConfiguredBusStops() {
        expectReverseGeocode();
        expectLocalSearch("지하철역", """
                {"items": [
                  {"title": "시청역", "roadAddress": "서울 중구 세종대로 101",
                   "address": "서울 중구 정동 5-5", "mapx": "1269770000", "mapy": "375650000"}
                ]}
                """);
        BusStopProvider busStops = (latitude, longitude, radius) -> List.of(
                new NearbyPlace("tago:11:bus-1", "시청앞", MapCategory.TRANSPORT, "버스정류소",
                        BigDecimal.valueOf(37.565), BigDecimal.valueOf(126.978), 140));

        List<NearbyPlace> places = provider(busStops).nearby(CENTER_LATITUDE, CENTER_LONGITUDE, 1000,
                Set.of(MapCategory.TRANSPORT));

        assertThat(places).extracting(NearbyPlace::name).containsExactly("시청역", "시청앞");
        assertThat(places).allMatch(place -> place.category() == MapCategory.TRANSPORT);
        searchServer.verify();
    }

    @Test
    void transportKeepsSearchResultsWhenBusStopProviderFails() {
        expectReverseGeocode();
        expectLocalSearch("지하철역", """
                {"items": [
                  {"title": "시청역", "roadAddress": "서울 중구 세종대로 101",
                   "address": "서울 중구 정동 5-5", "mapx": "1269770000", "mapy": "375650000"}
                ]}
                """);
        BusStopProvider unavailable = (latitude, longitude, radius) -> {
            throw new IllegalStateException("TAGO unavailable");
        };

        List<NearbyPlace> places = provider(unavailable).nearby(CENTER_LATITUDE, CENTER_LONGITUDE, 1000,
                Set.of(MapCategory.TRANSPORT));

        assertThat(places).extracting(NearbyPlace::name).containsExactly("시청역");
        searchServer.verify();
    }

    private NaverMapProvider provider() {
        return new NaverMapProvider(mapsBuilder.build(), searchBuilder.build());
    }

    private NaverMapProvider provider(BusStopProvider busStopProvider) {
        return new NaverMapProvider(mapsBuilder.build(), searchBuilder.build(), busStopProvider);
    }

    private void expectReverseGeocode() {
        mapsServer.expect(requestTo(Matchers.containsString("/map-reversegeocode/v2/gc")))
                .andExpect(queryParam("coords", "126.978,37.5665"))
                .andExpect(queryParam("orders", "addr,roadaddr"))
                .andRespond(withSuccess("""
                        {"results": [
                          {"name": "addr",
                           "region": {"area1": {"name": "서울특별시"}, "area2": {"name": "중구"},
                                      "area3": {"name": "태평로1가"}, "area4": {"name": ""}},
                           "land": {"name": "", "number1": "31", "number2": "3"}},
                          {"name": "roadaddr",
                           "region": {"area1": {"name": "서울특별시"}, "area2": {"name": "중구"},
                                      "area3": {"name": ""}, "area4": {"name": ""}},
                           "land": {"name": "세종대로", "number1": "110", "number2": ""}}
                        ]}
                        """, MediaType.APPLICATION_JSON));
    }

    private void expectLocalSearch(String keyword, String body) {
        String query = UriUtils.encode("서울특별시 중구 세종대로 110 " + keyword, StandardCharsets.UTF_8);
        searchServer.expect(requestTo(Matchers.containsString("/search/v1/local")))
                .andExpect(requestTo(Matchers.containsString("query=" + query)))
                .andExpect(queryParam("display", "5"))
                .andRespond(withSuccess(body, MediaType.APPLICATION_JSON));
    }
}
