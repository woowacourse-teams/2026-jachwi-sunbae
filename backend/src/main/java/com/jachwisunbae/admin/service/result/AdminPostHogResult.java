package com.jachwisunbae.admin.service.result;

import java.time.Instant;
import java.util.List;

public record AdminPostHogResult(Instant startTime, Instant endTime, List<AdminPostHogEvent> events) {
}
