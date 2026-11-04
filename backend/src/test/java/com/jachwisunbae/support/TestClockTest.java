package com.jachwisunbae.support;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TestClockTest {

    @Test
    @DisplayName("시간을 앞으로 돌린 뒤 초기화하면 시계를 만든 시각으로 돌아간다")
    void resetsAdvancedClock() {
        // given
        TestClock clock = new TestClock();
        Instant initial = clock.instant();
        clock.advance(Duration.ofDays(1));

        // when
        clock.reset();

        // then
        assertThat(clock.instant()).isEqualTo(initial);
    }

    @Test
    @DisplayName("시각을 직접 지정한 뒤 초기화해도 처음 시각으로 돌아간다")
    void resetsChangedClock() {
        // given
        Instant initial = Instant.now();
        TestClock clock = new TestClock(initial);
        clock.set(initial.minus(Duration.ofDays(1)));

        // when
        clock.reset();

        // then
        assertThat(clock.instant()).isEqualTo(initial);
    }
}
