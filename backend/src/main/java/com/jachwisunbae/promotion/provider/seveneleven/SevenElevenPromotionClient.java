package com.jachwisunbae.promotion.provider.seveneleven;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class SevenElevenPromotionClient {

    static final String BASE_URL = "https://www.7-eleven.co.kr";
    public static final String SOURCE_URL = BASE_URL + "/product/presentList.asp";

    private final RestClient client;
    private boolean requested;

    @Autowired
    public SevenElevenPromotionClient() {
        this(createClient());
    }

    SevenElevenPromotionClient(final RestClient client) {
        this.client = client;
    }

    synchronized String fetchFirst(final SevenElevenPromotionTab tab) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("pTab", tab.code());
        return post("/product/presentList.asp", form);
    }

    synchronized String fetchMore(final SevenElevenPromotionTab tab, final int page) {
        if (page < 2) {
            throw new IllegalArgumentException("더보기는 첫 화면 이후인 2페이지부터 요청합니다.");
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("intPageSize", String.valueOf(tab.pageSize()));
        form.add("intCurrPage", String.valueOf(page));
        form.add("cateCd1", "");
        form.add("cateCd2", "");
        form.add("cateCd3", "");
        form.add("pTab", tab.code());
        return post("/product/listMoreAjax.asp", form);
    }

    private String post(final String path, final MultiValueMap<String, String> form) {
        if (requested) {
            try {
                Thread.sleep(Duration.ofSeconds(1));
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("세븐일레븐 수집 대기가 중단되었습니다.", exception);
            }
        }
        requested = true;
        try {
            return client.post().uri(path).contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .accept(MediaType.TEXT_HTML).body(form).exchange((request, response) -> {
                        int status = response.getStatusCode().value();
                        if (status != HttpStatus.OK.value()) {
                            throw new UpstreamServiceException(ErrorCode.PROMOTION_PROVIDER_UNAVAILABLE,
                                    "세븐일레븐 요청 실패. path=" + path + ", HTTP status=" + status);
                        }
                        return StreamUtils.copyToString(response.getBody(), StandardCharsets.UTF_8);
                    });
        } catch (RestClientException exception) {
            throw new UpstreamServiceException(ErrorCode.PROMOTION_PROVIDER_UNAVAILABLE,
                    "세븐일레븐 응답 수신 실패. path=" + path, exception);
        }
    }

    private static RestClient createClient() {
        HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3))
                .followRedirects(HttpClient.Redirect.NEVER).build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(Duration.ofSeconds(15));
        return RestClient.builder().baseUrl(BASE_URL).requestFactory(factory).build();
    }
}
