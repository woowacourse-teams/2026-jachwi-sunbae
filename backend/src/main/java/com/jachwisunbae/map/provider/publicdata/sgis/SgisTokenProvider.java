package com.jachwisunbae.map.provider.publicdata.sgis;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;

// 유효한 SGIS access token을 제공한다. 발급한 토큰을 재사용하고 만료가 가까우면 새로 발급한다.
@Component
@ConditionalOnProperty(name = "map.provider.mode", havingValue = "public")
public class SgisTokenProvider {

    // 토큰 유효시간(4시간)이 끝나기 직전에 호출이 실패하지 않도록 미리 새로 발급한다.
    private static final Duration REFRESH_MARGIN = Duration.ofMinutes(5);

    private final SgisAuthClient authClient;
    private final Clock clock;
    private SgisAccessToken accessToken;

    public SgisTokenProvider(SgisAuthClient authClient, Clock clock) {
        this.authClient = authClient;
        this.clock = clock;
    }

    // 여러 요청이 동시에 토큰을 발급하지 않도록 synchronized로 막는다.
    public synchronized String getToken() {
        if (accessToken == null || !accessToken.expiresAt().minus(REFRESH_MARGIN).isAfter(clock.instant())) {
            accessToken = authClient.issue();
        }
        return accessToken.value();
    }
}
