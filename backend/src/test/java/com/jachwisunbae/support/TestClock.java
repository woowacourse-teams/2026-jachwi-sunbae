package com.jachwisunbae.support;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicReference;

// 시각을 정하고 앞으로 돌릴 수 있는 시계다. 단위 테스트는 직접 만들고, 스프링 테스트는 TestClockConfig로 주입받는다.
public class TestClock extends Clock {

    // 테스트 JVM에서 한 번만 현재 시각을 잡는다. DB의 DATETIME(6)과 같은 정밀도를 사용한다.
    private static final Instant TEST_STARTED_AT = Instant.now().truncatedTo(ChronoUnit.MICROS);

    private final Instant initialInstant;
    private final AtomicReference<Instant> now;
    private final ZoneId zone;

    public TestClock() {
        this(TEST_STARTED_AT);
    }

    public TestClock(final Instant instant) {
        this(instant, new AtomicReference<>(instant), ZoneOffset.UTC);
    }

    private TestClock(final Instant initialInstant, final AtomicReference<Instant> now, final ZoneId zone) {
        this.initialInstant = initialInstant;
        this.now = now;
        this.zone = zone;
    }

    public void reset() {
        now.set(initialInstant);
    }

    public void set(final Instant instant) {
        now.set(instant);
    }

    public void advance(final Duration duration) {
        now.updateAndGet(instant -> instant.plus(duration));
    }

    @Override
    public ZoneId getZone() {
        return zone;
    }

    @Override
    public Clock withZone(final ZoneId zone) {
        Objects.requireNonNull(zone);
        return this.zone.equals(zone) ? this : new TestClock(initialInstant, now, zone);
    }

    @Override
    public Instant instant() {
        return now.get();
    }
}
