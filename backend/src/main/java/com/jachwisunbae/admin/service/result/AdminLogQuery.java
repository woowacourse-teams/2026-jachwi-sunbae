package com.jachwisunbae.admin.service.result;

import java.time.Instant;
import java.util.List;

public record AdminLogQuery(
        String queryId,
        String status,
        Instant startTime,
        Instant endTime,
        List<AdminLogEntry> logs
) {
}
