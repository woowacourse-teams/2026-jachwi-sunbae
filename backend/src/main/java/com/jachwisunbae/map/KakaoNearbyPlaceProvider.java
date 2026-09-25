package com.jachwisunbae.map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.MissingNode;
import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@ConditionalOnProperty(name = "map.nearby.provider", havingValue = "kakao")
public class KakaoNearbyPlaceProvider implements NearbyPlaceProvider {

    private static final String BASE_URL = "https://dapi.kakao.com";
    private static final int PAGE_SIZE = 15;
    // 캐시 없이 요청마다 호출하므로 카테고리당 호출 수를 제한한다.
    private static final int MAX_PAGE_COUNT = 3;

    private final RestClient client;

    @Autowired
    public KakaoNearbyPlaceProvider(@Value("${map.kakao.rest-api-key}") String restApiKey,
                                    @Value("${map.connect-timeout-millis:2000}") long connectTimeoutMillis,
                                    @Value("${map.read-timeout-millis:5000}") long readTimeoutMillis) {
        this(createClient(restApiKey, connectTimeoutMillis, readTimeoutMillis));
    }

    KakaoNearbyPlaceProvider(RestClient client) {
        this.client = client;
    }

    private static RestClient createClient(String restApiKey, long connectTimeoutMillis, long readTimeoutMillis) {
        if (restApiKey == null || restApiKey.isBlank()) {
            throw new IllegalStateException("kakao 주변 시설 모드에는 KAKAO_REST_API_KEY가 필요합니다.");
        }
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(connectTimeoutMillis))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofMillis(readTimeoutMillis));
        return RestClient.builder()
                .baseUrl(BASE_URL)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "KakaoAK " + restApiKey)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .requestFactory(requestFactory)
                .build();
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
            JsonNode root = request(category, latitude, longitude, radius, page);
            for (JsonNode document : root.path("documents")) {
                NearbyPlace place = place(document, category);
                unique.putIfAbsent(place.providerPlaceId(), place);
            }
            if (root.path("meta").path("is_end").asBoolean(true)) {
                return;
            }
        }
    }

    private JsonNode request(MapCategory category, BigDecimal latitude, BigDecimal longitude, int radius,
                             int page) {
        try {
            JsonNode result = client.get().uri(uri -> uri.path("/v2/local/search/category.json")
                            .queryParam("category_group_code", categoryCode(category))
                            .queryParam("x", longitude)
                            .queryParam("y", latitude)
                            .queryParam("radius", radius)
                            .queryParam("sort", "distance")
                            .queryParam("page", page)
                            .queryParam("size", PAGE_SIZE)
                            .build())
                    .retrieve()
                    .body(JsonNode.class);
            return result == null ? MissingNode.getInstance() : result;
        } catch (RuntimeException exception) {
            throw new BusinessException(DomainErrorCode.MAP_PROVIDER_UNAVAILABLE,
                    "주변 시설 공급자 요청에 실패했습니다.", exception);
        }
    }

    private NearbyPlace place(JsonNode document, MapCategory category) {
        return new NearbyPlace("kakao:" + document.path("id").asText(),
                document.path("place_name").asText(""),
                category,
                firstNonBlank(document.path("road_address_name").asText(""),
                        document.path("address_name").asText("")),
                new BigDecimal(document.path("y").asText("0")),
                new BigDecimal(document.path("x").asText("0")),
                document.path("distance").asInt());
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

    private String firstNonBlank(String first, String second) {
        return first.isBlank() ? second : first;
    }
}
