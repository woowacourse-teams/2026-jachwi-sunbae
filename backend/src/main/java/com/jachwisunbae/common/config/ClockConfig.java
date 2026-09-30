package com.jachwisunbae.common.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// 현재 시각을 쓰는 곳(인증, 매물, SGIS 토큰 등)이 같은 Clock을 주입받아 테스트에서 시각을 고정할 수 있게 한다.
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
