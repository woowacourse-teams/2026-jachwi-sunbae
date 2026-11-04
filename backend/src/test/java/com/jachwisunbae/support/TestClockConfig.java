package com.jachwisunbae.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.event.BeforeTestMethodEvent;

// 컨텍스트 시작 시각에 시계를 고정하고 테스트마다 그 시각으로 복원한다.
// 특정 날짜나 시간 경계를 검증할 때만 @BeforeEach에서 시각을 바꾼다.
@TestConfiguration(proxyBeanMethods = false)
public class TestClockConfig {

    @Bean
    @Primary
    TestClock testClock() {
        return new TestClock();
    }

    @Bean
    ApplicationListener<BeforeTestMethodEvent> resetTestClock(final TestClock clock) {
        return event -> clock.reset();
    }
}
