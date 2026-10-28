package com.jachwisunbae.promotion.provider.seveneleven;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger LOG = LoggerFactory.getLogger(SevenElevenPromotionClient.class);
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
        return post("/product/presentList.asp", form, tab, 1);
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
        return post("/product/listMoreAjax.asp", form, tab, page);
    }

    private String post(final String path, final MultiValueMap<String, String> form,
                        final SevenElevenPromotionTab tab, final int page) {
        long waitStartedAt = System.nanoTime();
        if (requested) {
            try {
                Thread.sleep(Duration.ofSeconds(1));
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("세븐일레븐 수집 대기가 중단되었습니다.", exception);
            }
        }
        long waitMillis = elapsedMillis(waitStartedAt);
        requested = true;
        long httpStartedAt = System.nanoTime();
        try {
            return client.post().uri(path).contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .accept(MediaType.TEXT_HTML).body(form).exchange((request, response) -> {
                        int status = response.getStatusCode().value();
                        if (status != HttpStatus.OK.value()) {
                            LOG.warn("promotion-http-end brand=SEVEN_ELEVEN tab={} page={} status={} success=false "
                                            + "waitMillis={} httpElapsedMillis={}",
                                    tab, page, status, waitMillis, elapsedMillis(httpStartedAt));
                            throw new UpstreamServiceException(ErrorCode.PROMOTION_PROVIDER_UNAVAILABLE,
                                    "세븐일레븐 요청 실패. tab=" + tab + ", page=" + page + ", HTTP status=" + status);
                        }
                        String html = StreamUtils.copyToString(response.getBody(), StandardCharsets.UTF_8);
                        LOG.info("promotion-http-end brand=SEVEN_ELEVEN tab={} page={} status={} success=true "
                                        + "waitMillis={} httpElapsedMillis={}",
                                tab, page, status, waitMillis, elapsedMillis(httpStartedAt));
                        return html;
                    });
        } catch (RestClientException exception) {
            LOG.warn("promotion-http-end brand=SEVEN_ELEVEN tab={} page={} success=false waitMillis={} "
                            + "httpElapsedMillis={} exceptionType={} causeType={}",
                    tab, page, waitMillis, elapsedMillis(httpStartedAt), exception.getClass().getSimpleName(),
                    exception.getCause() == null ? "none" : exception.getCause().getClass().getSimpleName());
            throw new UpstreamServiceException(ErrorCode.PROMOTION_PROVIDER_UNAVAILABLE,
                    "세븐일레븐 응답 수신 실패. tab=" + tab + ", page=" + page + ", path=" + path, exception);
        }
    }

    private long elapsedMillis(final long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000;
    }

    private static RestClient createClient() {
        HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3))
                .followRedirects(HttpClient.Redirect.NEVER).build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
        // 재시도 없이 전체를 수집하므로 한 번의 느린 응답에 최대 30초를 허용한다.
        factory.setReadTimeout(Duration.ofSeconds(30));
        return RestClient.builder().baseUrl(BASE_URL).requestFactory(factory).build();
    }
}
