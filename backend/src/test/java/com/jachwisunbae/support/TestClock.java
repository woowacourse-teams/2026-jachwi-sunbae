package com.jachwisunbae.support;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicReference;

// 시각을 정하고 앞으로 돌릴 수 있는 시계다. 단위 테스트는 직접 만들고, 스프링 테스트는 TestClockConfig로 주입받는다.
public class TestClock extends Clock {

    private final Instant initialInstant;
    private final AtomicReference<Instant> now;

    public TestClock() {
        this(Instant.now());
    }

    public TestClock(final Instant instant) {
        this.initialInstant = instant;
        this.now = new AtomicReference<>(instant);
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
        return ZoneOffset.UTC;
    }

    @Override
    public Clock withZone(final ZoneId zone) {
        return Clock.fixed(instant(), zone);
    }

    @Override
    public Instant instant() {
        return now.get();
    }
}
