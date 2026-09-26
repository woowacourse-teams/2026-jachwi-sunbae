package com.jachwisunbae.map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.MissingNode;
import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
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
public class KakaoPlaceClient {

    private static final String BASE_URL = "https://dapi.kakao.com";
    private static final int PAGE_SIZE = 15;

    private final RestClient client;

    @Autowired
    public KakaoPlaceClient(@Value("${map.kakao.rest-api-key}") String restApiKey,
                            @Value("${map.connect-timeout-millis:2000}") long connectTimeoutMillis,
                            @Value("${map.read-timeout-millis:5000}") long readTimeoutMillis) {
        this(createClient(restApiKey, connectTimeoutMillis, readTimeoutMillis));
    }

    KakaoPlaceClient(RestClient client) {
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

    public KakaoCategorySearchResponse searchCategory(String categoryCode, BigDecimal latitude,
                                                      BigDecimal longitude, int radius, int page) {
        try {
            JsonNode root = client.get().uri(uri -> uri.path("/v2/local/search/category.json")
                            .queryParam("category_group_code", categoryCode)
                            .queryParam("x", longitude)
                            .queryParam("y", latitude)
                            .queryParam("radius", radius)
                            .queryParam("sort", "distance")
                            .queryParam("page", page)
                            .queryParam("size", PAGE_SIZE)
                            .build())
                    .retrieve()
                    .body(JsonNode.class);
            return response(root == null ? MissingNode.getInstance() : root);
        } catch (RuntimeException exception) {
            throw new BusinessException(DomainErrorCode.MAP_PROVIDER_UNAVAILABLE,
                    "주변 시설 공급자 요청에 실패했습니다.", exception);
        }
    }

    private KakaoCategorySearchResponse response(JsonNode root) {
        List<KakaoCategorySearchResponse.Document> documents = new ArrayList<>();
        for (JsonNode document : root.path("documents")) {
            documents.add(new KakaoCategorySearchResponse.Document(
                    text(document, "id"),
                    text(document, "place_name"),
                    text(document, "road_address_name"),
                    text(document, "address_name"),
                    decimal(document, "y"),
                    decimal(document, "x"),
                    integer(document, "distance")));
        }
        return new KakaoCategorySearchResponse(List.copyOf(documents),
                root.path("meta").path("is_end").asBoolean(true));
    }

    private String text(JsonNode node, String name) {
        String value = node.path(name).asText("");
        return value.isBlank() ? null : value;
    }

    private BigDecimal decimal(JsonNode node, String name) {
        String value = text(node, name);
        return value == null ? null : new BigDecimal(value);
    }

    private Integer integer(JsonNode node, String name) {
        String value = text(node, name);
        return value == null ? null : Integer.valueOf(value);
    }
}
