package com.jachwisunbae.promotion.provider.seveneleven;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import java.io.IOException;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

// 세븐일레븐 행사상품 첫 화면과 더보기 목록을 요청 간격을 지켜 하나씩 POST로 요청한다.
@Component
public class SevenElevenPromotionClient {

    private static final Logger LOG = LoggerFactory.getLogger(SevenElevenPromotionClient.class);
    static final String BASE_URL = "https://www.7-eleven.co.kr";
    static final String FIRST_PATH = "/product/presentList.asp";
    static final String MORE_PATH = "/product/listMoreAjax.asp";
    private static final Duration REQUEST_INTERVAL = Duration.ofSeconds(1);
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(3);
    // 재시도하지 않고 전체를 수집하므로 실측에서 느렸던 응답까지 기다린다.
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(30);

    private final RestClient client;
    private boolean requested;

    @Autowired
    public SevenElevenPromotionClient() {
        this(createClient());
    }

    SevenElevenPromotionClient(final RestClient client) {
        this.client = client;
    }

    // 첫 화면은 탭만 지정한다. 응답의 목록 크기와 전체 상품 수는 Parser가 읽는다.
    synchronized String fetchFirst(final SevenElevenPromotionTab tab) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("pTab", tab.code());
        return post(FIRST_PATH, form, tab, 1);
    }

    // 더보기는 2페이지부터 요청하며, 브라우저가 보내는 빈 분류 필터를 그대로 보낸다.
    synchronized String fetchMore(final SevenElevenPromotionTab tab, final int page) {
        if (page < 2) {
            throw new IllegalArgumentException("더보기는 첫 화면 이후인 2페이지부터 요청합니다.");
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("intPageSize", String.valueOf(tab.moreSize()));
        form.add("intCurrPage", String.valueOf(page));
        form.add("cateCd1", "");
        form.add("cateCd2", "");
        form.add("cateCd3", "");
        form.add("pTab", tab.code());
        return post(MORE_PATH, form, tab, page);
    }

    private String post(final String path, final MultiValueMap<String, String> form,
                        final SevenElevenPromotionTab tab, final int page) {
        waitForNextRequest();
        requested = true;
        long startedAt = System.nanoTime();
        try {
            return client.post().uri(path)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .accept(MediaType.TEXT_HTML)
                    .body(form)
                    .exchange((request, response) -> readPage(response, tab, page, startedAt));
        } catch (RestClientException exception) {
            logFailure(tab, page, null, startedAt);
            throw new UpstreamServiceException(ErrorCode.PROMOTION_PROVIDER_UNAVAILABLE,
                    "세븐일레븐 응답을 수신하지 못했습니다. tab=" + tab + ", page=" + page, exception);
        }
    }

    private String readPage(final ClientHttpResponse response, final SevenElevenPromotionTab tab, final int page,
                            final long startedAt) throws IOException {
        int httpStatus = response.getStatusCode().value();
        // 접근 제한과 리다이렉트도 재시도하거나 따라가지 않는다.
        if (httpStatus != HttpStatus.OK.value()) {
            logFailure(tab, page, httpStatus, startedAt);
            throw new UpstreamServiceException(ErrorCode.PROMOTION_PROVIDER_UNAVAILABLE,
                    "세븐일레븐 요청에 실패했습니다. tab=" + tab + ", page=" + page + ", HTTP status=" + httpStatus);
        }
        try {
            return StreamUtils.copyToString(response.getBody(), StandardCharsets.UTF_8);
        } catch (IOException exception) {
            // 헤더 수신 후 본문 읽기가 실패하면 이미 확인한 HTTP 상태를 보존한다.
            logFailure(tab, page, httpStatus, startedAt);
            throw new UpstreamServiceException(ErrorCode.PROMOTION_PROVIDER_UNAVAILABLE,
                    "세븐일레븐 응답 본문을 읽지 못했습니다. tab=" + tab + ", page=" + page, exception);
        }
    }

    private void logFailure(final SevenElevenPromotionTab tab, final int page, final Integer httpStatus,
                            final long startedAt) {
        // 허용한 메타데이터만 기록한다. 응답 본문과 원본 예외 메시지는 로그에 전달하지 않는다.
        LOG.atWarn()
                .addKeyValue("tab", tab.name())
                .addKeyValue("page", page)
                .addKeyValue("errorCode", ErrorCode.PROMOTION_PROVIDER_UNAVAILABLE.name())
                .addKeyValue("httpStatus", httpStatus)
                .addKeyValue("durationMs", TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedAt))
                .log("promotion-seven-eleven-request-failed");
    }

    private void waitForNextRequest() {
        if (requested) {
            try {
                Thread.sleep(REQUEST_INTERVAL);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("세븐일레븐 수집 대기가 중단되었습니다.", exception);
            }
        }
    }

    private static RestClient createClient() {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(CONNECT_TIMEOUT)
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(READ_TIMEOUT);
        return RestClient.builder().baseUrl(BASE_URL).requestFactory(factory).build();
    }
}
