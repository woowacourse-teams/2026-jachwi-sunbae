package com.jachwisunbae.map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.MissingNode;
import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
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
@ConditionalOnProperty(name = "map.provider.mode", havingValue = "public")
public class JusoAddressClient {

    private static final String BASE_URL = "https://business.juso.go.kr";
    private static final int COUNT_PER_PAGE = 5;
    private static final String SUCCESS = "0";
    // 검색어 형식이 맞지 않을 때의 오류 코드다. 사용자 입력 문제라 검색 결과가 없는 것으로 처리한다.
    private static final Set<String> INVALID_KEYWORD_CODES =
            Set.of("E0005", "E0006", "E0008", "E0009", "E0010", "E0012", "E0013");

    private final RestClient client;
    private final String confirmKey;

    @Autowired
    public JusoAddressClient(@Value("${map.juso.confirm-key}") String confirmKey,
                             @Value("${map.connect-timeout-millis:2000}") long connectTimeoutMillis,
                             @Value("${map.read-timeout-millis:5000}") long readTimeoutMillis) {
        this(createClient(connectTimeoutMillis, readTimeoutMillis), confirmKey);
    }

    JusoAddressClient(RestClient client, String confirmKey) {
        if (confirmKey == null || confirmKey.isBlank()) {
            throw new IllegalStateException("public 주소 모드에는 JUSO_CONFIRM_KEY가 필요합니다.");
        }
        this.client = client;
        this.confirmKey = confirmKey;
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

    public JusoAddressSearchResponse search(String keyword) {
        JsonNode results = request(keyword).path("results");
        JsonNode common = results.path("common");
        String errorCode = common.path("errorCode").asText("");
        if (INVALID_KEYWORD_CODES.contains(errorCode)) {
            return new JusoAddressSearchResponse(List.of());
        }
        if (!SUCCESS.equals(errorCode)) {
            throw new BusinessException(DomainErrorCode.MAP_PROVIDER_UNAVAILABLE,
                    "행안부 주소 검색이 실패했습니다. errorCode=" + errorCode
                            + ", errorMessage=" + common.path("errorMessage").asText(""));
        }
        return response(results.path("juso"));
    }

    private JsonNode request(String keyword) {
        try {
            JsonNode root = client.get().uri(uri -> uri.path("/addrlink/addrLinkApi.do")
                            .queryParam("confmKey", confirmKey)
                            .queryParam("currentPage", 1)
                            .queryParam("countPerPage", COUNT_PER_PAGE)
                            .queryParam("keyword", keyword)
                            .queryParam("resultType", "json")
                            .build())
                    .retrieve()
                    .body(JsonNode.class);
            return root == null ? MissingNode.getInstance() : root;
        } catch (RuntimeException exception) {
            throw new BusinessException(DomainErrorCode.MAP_PROVIDER_UNAVAILABLE,
                    "행안부 주소 검색 요청에 실패했습니다.", exception);
        }
    }

    private JusoAddressSearchResponse response(JsonNode juso) {
        List<JusoAddressSearchResponse.Address> addresses = new ArrayList<>();
        for (JsonNode address : juso) {
            addresses.add(new JusoAddressSearchResponse.Address(
                    text(address, "roadAddrPart1"), text(address, "jibunAddr")));
        }
        return new JusoAddressSearchResponse(List.copyOf(addresses));
    }

    private String text(JsonNode node, String name) {
        String value = node.path(name).asText("");
        return value.isBlank() ? null : value;
    }
}
