package com.jachwisunbae.support;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TestClockTest {

    @Test
    @DisplayName("시간대를 바꾼 시계에도 원래 시계에서 지정한 시각이 반영된다")
    void sharesSetInstantWithZonedClock() {
        // given
        TestClock clock = new TestClock();
        ZoneId zone = ZoneId.of("Asia/Seoul");
        Clock zonedClock = clock.withZone(zone);
        Instant changed = clock.instant().plus(Duration.ofDays(1));

        // when
        clock.set(changed);

        // then
        assertThat(zonedClock.instant()).isEqualTo(changed);
        assertThat(zonedClock.getZone()).isEqualTo(zone);
    }

    @Test
    @DisplayName("시간대를 바꾼 시계에도 원래 시계에서 앞으로 돌린 시간이 반영된다")
    void sharesAdvancedInstantWithZonedClock() {
        // given
        TestClock clock = new TestClock();
        Clock zonedClock = clock.withZone(ZoneId.of("Asia/Seoul"));
        Instant initial = clock.instant();

        // when
        clock.advance(Duration.ofSeconds(31));

        // then
        assertThat(zonedClock.instant()).isEqualTo(initial.plusSeconds(31));
    }

    @Test
    @DisplayName("시간대를 바꾼 시계도 초기화하면 같은 시작 시각으로 돌아간다")
    void sharesResetInstantWithZonedClock() {
        // given
        TestClock clock = new TestClock();
        Clock zonedClock = clock.withZone(ZoneId.of("Asia/Seoul"));
        Instant initial = clock.instant();
        clock.advance(Duration.ofDays(1));

        // when
        clock.reset();

        // then
        assertThat(zonedClock.instant()).isEqualTo(initial);
    }

    @Test
    @DisplayName("기본 시계는 객체를 새로 만들어도 같은 테스트 시작 시각을 사용한다")
    void sharesTestStartAcrossClockInstances() {
        // given
        TestClock first = new TestClock();
        Instant startedAt = first.instant();
        first.advance(Duration.ofDays(1));

        // when
        TestClock second = new TestClock();

        // then
        assertThat(second.instant()).isEqualTo(startedAt);
        assertThat(first.instant()).isEqualTo(startedAt.plus(Duration.ofDays(1)));
    }

    @Test
    @DisplayName("시간을 앞으로 돌린 뒤 초기화하면 테스트 시작 시각으로 돌아간다")
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
        Instant initial = new TestClock().instant().minus(Duration.ofDays(1));
        TestClock clock = new TestClock(initial);
        clock.set(initial.minus(Duration.ofDays(1)));

        // when
        clock.reset();

        // then
        assertThat(clock.instant()).isEqualTo(initial);
    }
}
