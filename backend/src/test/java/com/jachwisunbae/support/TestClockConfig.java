package com.jachwisunbae.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

// 애플리케이션의 Clock 빈을 TestClock으로 바꾼다. 테스트는 TestClock을 주입받아 @BeforeEach에서 시각을 정한다.
@TestConfiguration(proxyBeanMethods = false)
public class TestClockConfig {

    @Bean
    @Primary
    TestClock testClock() {
        return new TestClock();
    }
}
