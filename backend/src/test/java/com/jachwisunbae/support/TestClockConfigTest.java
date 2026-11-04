package com.jachwisunbae.support;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.test.context.TestContext;
import org.springframework.test.context.event.BeforeTestMethodEvent;

class TestClockConfigTest {

    @Test
    @DisplayName("서로 다른 테스트 컨텍스트도 같은 테스트 시작 시각을 사용한다")
    void sharesTestStartAcrossContexts() {
        // given
        try (AnnotationConfigApplicationContext first = new AnnotationConfigApplicationContext(TestClockConfig.class);
                AnnotationConfigApplicationContext second = new AnnotationConfigApplicationContext(TestClockConfig.class)) {
            // when
            Instant firstStartedAt = first.getBean(TestClock.class).instant();
            Instant secondStartedAt = second.getBean(TestClock.class).instant();

            // then
            assertThat(firstStartedAt).isEqualTo(secondStartedAt);
        }
    }

    @Test
    @DisplayName("공통 시계는 컨텍스트에서 공유하고 다음 테스트 시작 전에 초기 시각으로 복원한다")
    void restoresSharedClockBeforeNextTest() {
        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(TestClockConfig.class)) {
            // given
            TestClock clock = context.getBean(TestClock.class);
            Instant initial = clock.instant();
            clock.advance(Duration.ofDays(1));

            // when
            context.publishEvent(new BeforeTestMethodEvent(mock(TestContext.class)));

            // then
            assertThat(context.getBean(Clock.class)).isSameAs(clock);
            assertThat(clock.instant()).isEqualTo(initial);
        }
    }
}
