package com.jachwisunbae.map.provider.publicdata;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.MissingNode;
import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.function.BiFunction;
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
@ConditionalOnProperty(name = "map.provider.mode", havingValue = "public")
public class SgisAddressClient {

    private static final String BASE_URL = "https://sgisapi.mods.go.kr";
    private static final int SUCCESS = 0;
    private static final int NO_RESULT = -100;
    private static final int UNAUTHORIZED = -401;
    private static final String ROAD_ADDRESS_TYPE = "10";
    // 토큰 유효시간(4시간)이 끝나기 직전에 호출이 실패하지 않도록 미리 새로 발급한다.
    private static final Duration TOKEN_REFRESH_MARGIN = Duration.ofMinutes(5);

    private final RestClient client;
    private final String consumerKey;
    private final String consumerSecret;
    private final Clock clock;
    private AccessToken accessToken;

    @Autowired
    public SgisAddressClient(@Value("${map.sgis.consumer-key}") String consumerKey,
                             @Value("${map.sgis.consumer-secret}") String consumerSecret,
                             @Value("${map.connect-timeout-millis:2000}") long connectTimeoutMillis,
                             @Value("${map.read-timeout-millis:5000}") long readTimeoutMillis,
                             Clock clock) {
        this(createClient(connectTimeoutMillis, readTimeoutMillis), consumerKey, consumerSecret, clock);
    }

    SgisAddressClient(RestClient client, String consumerKey, String consumerSecret, Clock clock) {
        if (consumerKey == null || consumerKey.isBlank() || consumerSecret == null || consumerSecret.isBlank()) {
            throw new IllegalStateException("public 주소 모드에는 SGIS_CONSUMER_KEY와 SGIS_CONSUMER_SECRET이 필요합니다.");
        }
        this.client = client;
        this.consumerKey = consumerKey;
        this.consumerSecret = consumerSecret;
        this.clock = clock;
    }

    private static RestClient createClient(long connectTimeoutMillis, long readTimeoutMillis) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(connectTimeoutMillis))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofMillis(readTimeoutMillis));
        return RestClient.builder()
                .baseUrl(BASE_URL)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .requestFactory(requestFactory)
                .build();
    }

    public Optional<SgisCoordinate> geocode(String address) {
        JsonNode root = requestWithToken((uri, token) -> uri.path("/OpenAPI3/addr/geocodewgs84.json")
                .queryParam("accessToken", token)
                .queryParam("address", address)
                .queryParam("resultcount", 1)
                .build());
        if (errorCode(root) == NO_RESULT) {
            return Optional.empty();
        }
        JsonNode first = root.path("result").path("resultdata").path(0);
        Optional<BigDecimal> latitude = decimal(first, "y");
        Optional<BigDecimal> longitude = decimal(first, "x");
        if (latitude.isEmpty() || longitude.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(new SgisCoordinate(latitude.get(), longitude.get()));
    }

    public Optional<String> reverseGeocode(BigDecimal latitude, BigDecimal longitude) {
        JsonNode root = requestWithToken((uri, token) -> uri.path("/OpenAPI3/addr/rgeocodewgs84.json")
                .queryParam("accessToken", token)
                .queryParam("x_coor", longitude)
                .queryParam("y_coor", latitude)
                .queryParam("addr_type", ROAD_ADDRESS_TYPE)
                .build());
        if (errorCode(root) == NO_RESULT) {
            return Optional.empty();
        }
        return text(root.path("result").path(0), "full_addr");
    }

    private JsonNode requestWithToken(BiFunction<UriBuilder, String, URI> uriWithToken) {
        String token = token(false);
        JsonNode root = request(uri -> uriWithToken.apply(uri, token));
        if (errorCode(root) == UNAUTHORIZED) {
            // 토큰이 예상보다 먼저 만료되었을 수 있어 한 번만 새로 발급해 다시 요청한다.
            String refreshedToken = token(true);
            root = request(uri -> uriWithToken.apply(uri, refreshedToken));
        }
        int errorCode = errorCode(root);
        if (errorCode != SUCCESS && errorCode != NO_RESULT) {
            throw unavailable(root);
        }
        return root;
    }

    private synchronized String token(boolean forceRefresh) {
        Instant now = clock.instant();
        if (forceRefresh || accessToken == null || !accessToken.expiresAt().minus(TOKEN_REFRESH_MARGIN).isAfter(now)) {
            accessToken = issueToken();
        }
        return accessToken.value();
    }

    private AccessToken issueToken() {
        JsonNode root = request(uri -> uri.path("/OpenAPI3/auth/authentication.json")
                .queryParam("consumer_key", consumerKey)
                .queryParam("consumer_secret", consumerSecret)
                .build());
        JsonNode result = root.path("result");
        Optional<String> value = text(result, "accessToken");
        Optional<String> timeout = text(result, "accessTimeout");
        if (errorCode(root) != SUCCESS || value.isEmpty() || timeout.isEmpty()) {
            throw unavailable(root);
        }
        try {
            return new AccessToken(value.get(), Instant.ofEpochMilli(Long.parseLong(timeout.get())));
        } catch (NumberFormatException exception) {
            throw new BusinessException(DomainErrorCode.MAP_PROVIDER_UNAVAILABLE,
                    "SGIS 토큰 만료 시각 형식이 올바르지 않습니다.", exception);
        }
    }

    private JsonNode request(Function<UriBuilder, URI> uri) {
        try {
            JsonNode root = client.get().uri(uri).retrieve().body(JsonNode.class);
            return root == null ? MissingNode.getInstance() : root;
        } catch (RuntimeException exception) {
            throw new BusinessException(DomainErrorCode.MAP_PROVIDER_UNAVAILABLE,
                    "SGIS 주소 요청에 실패했습니다.", exception);
        }
    }

    private int errorCode(JsonNode root) {
        return root.path("errCd").asInt(Integer.MIN_VALUE);
    }

    private BusinessException unavailable(JsonNode root) {
        return new BusinessException(DomainErrorCode.MAP_PROVIDER_UNAVAILABLE,
                "SGIS 주소 요청이 실패했습니다. errCd=" + root.path("errCd").asText("")
                        + ", errMsg=" + root.path("errMsg").asText(""));
    }

    // SGIS는 값이 없는 필드를 JSON null이 아닌 문자열 "null"로 준다.
    private Optional<String> text(JsonNode node, String name) {
        String value = node.path(name).asText("");
        return value.isBlank() || "null".equals(value) ? Optional.empty() : Optional.of(value);
    }

    private Optional<BigDecimal> decimal(JsonNode node, String name) {
        try {
            return text(node, name).map(BigDecimal::new);
        } catch (NumberFormatException exception) {
            throw new BusinessException(DomainErrorCode.MAP_PROVIDER_UNAVAILABLE,
                    "SGIS 좌표 응답 형식이 올바르지 않습니다.", exception);
        }
    }

    private record AccessToken(String value, Instant expiresAt) {
    }
}
