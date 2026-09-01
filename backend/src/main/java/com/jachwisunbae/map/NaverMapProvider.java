package com.jachwisunbae.map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.MissingNode;
import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriBuilder;

@Component
@ConditionalOnProperty(name = "map.provider.mode", havingValue = "naver")
public class NaverMapProvider implements MapProvider {

    private static final String MAPS_BASE_URL = "https://naveropenapi.apigw.ntruss.com";
    private static final String SEARCH_BASE_URL = "https://naverapihub.apigw.ntruss.com";
    private static final int SEARCH_DISPLAY = 5;
    private static final List<String> REGION_AREAS = List.of("area1", "area2", "area3", "area4");
    private static final BigDecimal COORDINATE_SCALE = BigDecimal.valueOf(10_000_000L);
    private static final BigDecimal COORDINATE_LIMIT = BigDecimal.valueOf(180);
    private static final double EARTH_RADIUS_METERS = 6_371_000d;
    private static final Logger LOG = LoggerFactory.getLogger(NaverMapProvider.class);

    private final RestClient client;
    private final RestClient searchClient;
    private final Optional<BusStopProvider> busStopProvider;

    @Autowired
    public NaverMapProvider(@Value("${map.naver.client-id}") String clientId,
                            @Value("${map.naver.client-secret}") String clientSecret,
                            @Value("${map.naver.search-client-id}") String searchClientId,
                            @Value("${map.naver.search-client-secret}") String searchClientSecret,
                            @Value("${map.connect-timeout-millis:2000}") long connectTimeoutMillis,
                            @Value("${map.read-timeout-millis:5000}") long readTimeoutMillis,
                            Optional<BusStopProvider> busStopProvider) {
        this(createClient(clientId, clientSecret, MAPS_BASE_URL, connectTimeoutMillis, readTimeoutMillis,
                        "naver 지도 모드에는 NAVER_MAP_CLIENT_ID와 NAVER_MAP_CLIENT_SECRET이 필요합니다."),
                createClient(searchClientId, searchClientSecret, SEARCH_BASE_URL, connectTimeoutMillis,
                        readTimeoutMillis,
                        "naver 지도 모드에는 NAVER_SEARCH_CLIENT_ID와 NAVER_SEARCH_CLIENT_SECRET이 필요합니다."),
                busStopProvider);
    }

    NaverMapProvider(RestClient client, RestClient searchClient) {
        this(client, searchClient, Optional.empty());
    }

    NaverMapProvider(RestClient client, RestClient searchClient, BusStopProvider busStopProvider) {
        this(client, searchClient, Optional.of(busStopProvider));
    }

    private NaverMapProvider(RestClient client, RestClient searchClient,
                             Optional<BusStopProvider> busStopProvider) {
        this.client = client;
        this.searchClient = searchClient;
        this.busStopProvider = busStopProvider;
    }

    private static RestClient createClient(String clientId, String clientSecret, String baseUrl,
                                           long connectTimeoutMillis, long readTimeoutMillis, String requirement) {
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            throw new IllegalStateException(requirement);
        }
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(connectTimeoutMillis))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofMillis(readTimeoutMillis));
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("X-NCP-APIGW-API-KEY-ID", clientId)
                .defaultHeader("X-NCP-APIGW-API-KEY", clientSecret)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public List<MapAddress> geocode(String query) {
        JsonNode root = request(client, uri -> uri.path("/map-geocode/v2/geocode")
                .queryParam("query", query)
                .queryParam("count", 10)
                .build());
        List<MapAddress> results = new ArrayList<>();
        for (JsonNode address : root.path("addresses")) {
            results.add(new MapAddress(text(address, "roadAddress"), text(address, "jibunAddress"),
                    decimal(address, "y"), decimal(address, "x")));
        }
        return results;
    }

    @Override
    public MapAddress reverseGeocode(BigDecimal latitude, BigDecimal longitude) {
        JsonNode root = request(client, uri -> uri.path("/map-reversegeocode/v2/gc")
                .queryParam("coords", longitude + "," + latitude)
                .queryParam("sourcecrs", "epsg:4326")
                .queryParam("orders", "addr,roadaddr")
                .queryParam("output", "json")
                .build());
        JsonNode results = root.path("results");
        return new MapAddress(addressFromResult(results, "roadaddr"), addressFromResult(results, "addr"),
                latitude, longitude);
    }

    @Override
    public List<NearbyPlace> nearby(BigDecimal latitude, BigDecimal longitude, int radius,
                                    Set<MapCategory> categories) {
        String centerAddress = reverseGeocode(latitude, longitude).address();
        Map<String, NearbyPlace> unique = new LinkedHashMap<>();
        for (MapCategory category : categories) {
            if (centerAddress != null && !centerAddress.isBlank()) {
                appendPlaces(unique, category, centerAddress, latitude, longitude, radius);
            }
            if (category == MapCategory.TRANSPORT) {
                appendBusStops(unique, latitude, longitude, radius);
            }
        }
        return List.copyOf(unique.values());
    }

    private void appendPlaces(Map<String, NearbyPlace> unique, MapCategory category, String centerAddress,
                              BigDecimal latitude, BigDecimal longitude, int radius) {
        JsonNode root = request(searchClient, uri -> uri.path("/search/v1/local")
                .queryParam("query", centerAddress + " " + searchKeyword(category))
                .queryParam("display", SEARCH_DISPLAY)
                .queryParam("start", 1)
                .queryParam("sort", "random")
                .build());
        for (JsonNode item : root.path("items")) {
            BigDecimal placeLatitude = coordinate(item, "mapy");
            BigDecimal placeLongitude = coordinate(item, "mapx");
            int distance = distanceMeters(latitude, longitude, placeLatitude, placeLongitude);
            if (distance > radius) {
                continue;
            }
            String name = stripHtml(text(item, "title"));
            String id = "naver:" + name + ":" + placeLatitude + ":" + placeLongitude;
            unique.putIfAbsent(id, new NearbyPlace(id, name, category,
                    firstNonBlank(text(item, "roadAddress"), text(item, "address")),
                    placeLatitude, placeLongitude, distance));
        }
    }

    private void appendBusStops(Map<String, NearbyPlace> unique, BigDecimal latitude, BigDecimal longitude,
                                int radius) {
        busStopProvider.ifPresent(provider -> {
            try {
                provider.nearby(latitude, longitude, radius)
                        .forEach(place -> unique.putIfAbsent(place.providerPlaceId(), place));
            } catch (RuntimeException exception) {
                LOG.warn("TAGO 버스정류소 조회에 실패해 Naver 지역 검색 결과만 반환합니다.", exception);
            }
        });
    }

    private String searchKeyword(MapCategory category) {
        return switch (category) {
            case HOSPITAL -> "병원";
            case TRANSPORT -> "지하철역";
            case SCHOOL -> "학교";
            case CONVENIENCE -> "편의점";
            case AGENCY -> "부동산";
        };
    }

    private String addressFromResult(JsonNode results, String name) {
        for (JsonNode result : results) {
            if (!name.equals(result.path("name").asText())) {
                continue;
            }
            JsonNode region = result.path("region");
            JsonNode land = result.path("land");
            StringBuilder address = new StringBuilder();
            for (String area : REGION_AREAS) {
                append(address, region.path(area).path("name").asText(""));
            }
            append(address, land.path("name").asText(""));
            append(address, landNumber(land));
            String value = address.toString().trim();
            return value.isBlank() ? null : value;
        }
        return null;
    }

    private void append(StringBuilder address, String part) {
        if (part == null || part.isBlank()) {
            return;
        }
        if (!address.isEmpty()) {
            address.append(' ');
        }
        address.append(part);
    }

    private String landNumber(JsonNode land) {
        String number1 = land.path("number1").asText("");
        String number2 = land.path("number2").asText("");
        if (number1.isBlank()) {
            return "";
        }
        return number2.isBlank() ? number1 : number1 + "-" + number2;
    }

    private int distanceMeters(BigDecimal firstLatitude, BigDecimal firstLongitude,
                               BigDecimal secondLatitude, BigDecimal secondLongitude) {
        double lat1 = Math.toRadians(firstLatitude.doubleValue());
        double lat2 = Math.toRadians(secondLatitude.doubleValue());
        double deltaLat = Math.toRadians(secondLatitude.subtract(firstLatitude).doubleValue());
        double deltaLng = Math.toRadians(secondLongitude.subtract(firstLongitude).doubleValue());
        double a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
                + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
        return (int) Math.round(EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }

    private JsonNode request(RestClient target, Function<UriBuilder, URI> uri) {
        try {
            JsonNode result = target.get().uri(uri).retrieve().body(JsonNode.class);
            return result == null ? MissingNode.getInstance() : result;
        } catch (RuntimeException exception) {
            throw new BusinessException(DomainErrorCode.MAP_PROVIDER_UNAVAILABLE,
                    "지도 공급자 요청에 실패했습니다.", exception);
        }
    }

    private BigDecimal coordinate(JsonNode node, String name) {
        BigDecimal value = decimal(node, name);
        return value.abs().compareTo(COORDINATE_LIMIT) > 0 ? value.divide(COORDINATE_SCALE) : value;
    }

    private BigDecimal decimal(JsonNode node, String name) {
        String value = node.path(name).asText("0");
        return value.isBlank() ? BigDecimal.ZERO : new BigDecimal(value);
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        return second == null ? "" : second;
    }

    private String stripHtml(String value) {
        return value == null ? "" : value.replaceAll("<[^>]+>", "");
    }

    private String text(JsonNode node, String name) {
        String value = node.path(name).asText("");
        return value.isBlank() ? null : value;
    }
}
