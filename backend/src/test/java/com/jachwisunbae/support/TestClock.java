package com.jachwisunbae.support;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicReference;

// 통합 테스트가 함께 쓰는 시계. 테스트마다 현재 시각으로 돌아가고, 필요한 테스트만 시각을 고정하거나 앞당긴다.
public class TestClock extends Clock {

    private final AtomicReference<Instant> now = new AtomicReference<>(Instant.now());

    public void set(final Instant instant) {
        now.set(instant);
    }

    public void advance(final Duration duration) {
        now.updateAndGet(instant -> instant.plus(duration));
    }

    public void reset() {
        now.set(Instant.now());
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
