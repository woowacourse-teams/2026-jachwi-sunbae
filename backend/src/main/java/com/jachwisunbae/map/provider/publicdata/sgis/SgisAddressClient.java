package com.jachwisunbae.map.provider.publicdata.sgis;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.MissingNode;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Objects;
import java.util.Optional;

// SGIS 주소 API와 통신해서 주소 ↔ 좌표 변환을 한다. 인증 토큰은 SgisTokenProvider에서 받는다.
@Component
@ConditionalOnProperty(name = "map.provider.mode", havingValue = "public")
public class SgisAddressClient {

    private static final String BASE_URL = "https://sgisapi.mods.go.kr";
    private static final int SUCCESS = 0;
    private static final int NO_RESULT = -100;

    private static final String ROAD_ADDRESS_TYPE = "10";

    private final RestClient client;
    private final SgisTokenProvider tokenProvider;

    @Autowired
    public SgisAddressClient(SgisTokenProvider tokenProvider,
                             @Value("${map.connect-timeout-millis:2000}") long connectTimeoutMillis,
                             @Value("${map.read-timeout-millis:5000}") long readTimeoutMillis) {
        this(createClient(connectTimeoutMillis, readTimeoutMillis), tokenProvider);
    }

    protected SgisAddressClient(RestClient client, SgisTokenProvider tokenProvider) {
        this.client = client;
        this.tokenProvider = tokenProvider;
    }

    private static RestClient createClient(long connectTimeoutMillis, long readTimeoutMillis) {
        //TODO connection pool / keep-alive 설정 고려
        HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(connectTimeoutMillis))
            .build();

        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofMillis(readTimeoutMillis));
        return RestClient.builder()
            .baseUrl(BASE_URL)
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)//json응답을 받고 싶다고 알림
            .requestFactory(requestFactory)
            .build();
    }

    //주소를 받아서 경도위도로 반환
    public Optional<SgisCoordinate> geocode(String address) {
        JsonNode root = requestGeocode(address, tokenProvider.getToken());
        if (isNoResult(root)) {
            return Optional.empty();
        }
        requireSuccess(root);

        JsonNode first = root.path("result").path("resultdata").path(0);
        Optional<BigDecimal> latitude = decimal(first, "y");
        Optional<BigDecimal> longitude = decimal(first, "x");
        if (latitude.isEmpty() || longitude.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(new SgisCoordinate(latitude.get(), longitude.get()));
    }

    //좌표를 받아서 도로명주소로 반환
    public Optional<String> reverseGeocode(BigDecimal latitude, BigDecimal longitude) {
        JsonNode root = requestReverseGeocode(latitude, longitude, tokenProvider.getToken());
        if (isNoResult(root)) {
            return Optional.empty();
        }
        requireSuccess(root);

        return text(root.path("result").path(0), "full_addr");
    }

    private JsonNode requestGeocode(String address, String token) {
        try {
            JsonNode root = client.get()
                .uri(uri -> uri.path("/OpenAPI3/addr/geocodewgs84.json")
                    .queryParam("accessToken", token)
                    .queryParam("address", address)
                    .queryParam("resultcount", 1)
                    .build())
                .retrieve()
                .body(JsonNode.class);
            return Objects.requireNonNullElse(root, MissingNode.getInstance());
        } catch (RestClientException exception) {
            throw requestFailed(exception);
        }
    }

    private JsonNode requestReverseGeocode(BigDecimal latitude, BigDecimal longitude, String token) {
        try {
            JsonNode root = client.get()
                .uri(uri -> uri.path("/OpenAPI3/addr/rgeocodewgs84.json")
                    .queryParam("accessToken", token)
                    .queryParam("x_coor", longitude)
                    .queryParam("y_coor", latitude)
                    .queryParam("addr_type", ROAD_ADDRESS_TYPE)
                    .build())
                .retrieve()
                .body(JsonNode.class);
            return Objects.requireNonNullElse(root, MissingNode.getInstance());
        } catch (RestClientException exception) {
            throw requestFailed(exception);
        }
    }

    private boolean isNoResult(JsonNode root) {
        return errorCode(root) == NO_RESULT;
    }

    private void requireSuccess(JsonNode root) {
        if (errorCode(root) != SUCCESS) {
            throw new UpstreamServiceException(ErrorCode.MAP_PROVIDER_UNAVAILABLE,
                "SGIS 주소 요청이 실패했습니다. errCd=" + root.path("errCd").asText("")
                    + ", errMsg=" + root.path("errMsg").asText(""));
        }
    }

    private UpstreamServiceException requestFailed(RestClientException exception) {
        return new UpstreamServiceException(ErrorCode.MAP_PROVIDER_UNAVAILABLE, "SGIS 주소 요청에 실패했습니다.", exception);
    }

    private int errorCode(JsonNode root) {
        return root.path("errCd").asInt(Integer.MIN_VALUE);
    }

    private Optional<BigDecimal> decimal(JsonNode node, String name) {
        try {
            return text(node, name).map(BigDecimal::new);
        } catch (NumberFormatException exception) {
            throw new UpstreamServiceException(ErrorCode.MAP_PROVIDER_UNAVAILABLE,
                "SGIS 좌표 응답 형식이 올바르지 않습니다.", exception);
        }
    }

    private Optional<String> text(JsonNode node, String name) {
        String value = node.path(name).asText("");
        if (value.isBlank() || "null".equals(value)) {
            return Optional.empty();
        }
        return Optional.of(value);
    }
}
