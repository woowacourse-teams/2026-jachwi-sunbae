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
import java.util.List;
import java.util.function.Function;
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
public class NaverMapProvider implements AddressProvider {

    private static final String MAPS_BASE_URL = "https://maps.apigw.ntruss.com";
    private static final List<String> REGION_AREAS = List.of("area1", "area2", "area3", "area4");

    private final RestClient client;

    @Autowired
    public NaverMapProvider(@Value("${map.naver.client-id}") String clientId,
                            @Value("${map.naver.client-secret}") String clientSecret,
                            @Value("${map.connect-timeout-millis:2000}") long connectTimeoutMillis,
                            @Value("${map.read-timeout-millis:5000}") long readTimeoutMillis) {
        this(createClient(clientId, clientSecret, connectTimeoutMillis, readTimeoutMillis));
    }

    NaverMapProvider(RestClient client) {
        this.client = client;
    }

    private static RestClient createClient(String clientId, String clientSecret,
                                           long connectTimeoutMillis, long readTimeoutMillis) {
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            throw new IllegalStateException("naver 지도 모드에는 NAVER_MAP_CLIENT_ID와 NAVER_MAP_CLIENT_SECRET이 필요합니다.");
        }
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(connectTimeoutMillis))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofMillis(readTimeoutMillis));
        return RestClient.builder()
                .baseUrl(MAPS_BASE_URL)
                .defaultHeader("X-NCP-APIGW-API-KEY-ID", clientId)
                .defaultHeader("X-NCP-APIGW-API-KEY", clientSecret)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public List<MapAddress> geocode(String query) {
        JsonNode root = request(uri -> uri.path("/map-geocode/v2/geocode")
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
        JsonNode root = request(uri -> uri.path("/map-reversegeocode/v2/gc")
                .queryParam("coords", longitude + "," + latitude)
                .queryParam("sourcecrs", "epsg:4326")
                .queryParam("orders", "addr,roadaddr")
                .queryParam("output", "json")
                .build());
        JsonNode results = root.path("results");
        return new MapAddress(addressFromResult(results, "roadaddr"), addressFromResult(results, "addr"),
                latitude, longitude);
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

    private JsonNode request(Function<UriBuilder, URI> uri) {
        try {
            JsonNode result = client.get().uri(uri).retrieve().body(JsonNode.class);
            return result == null ? MissingNode.getInstance() : result;
        } catch (RuntimeException exception) {
            throw new BusinessException(DomainErrorCode.MAP_PROVIDER_UNAVAILABLE,
                    "지도 공급자 요청에 실패했습니다.", exception);
        }
    }

    private BigDecimal decimal(JsonNode node, String name) {
        String value = node.path(name).asText("0");
        return value.isBlank() ? BigDecimal.ZERO : new BigDecimal(value);
    }

    private String text(JsonNode node, String name) {
        String value = node.path(name).asText("");
        return value.isBlank() ? null : value;
    }
}
