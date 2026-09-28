package com.jachwisunbae.checklist.repository.query;

import com.jachwisunbae.checklist.type.CheckStage;

public record UserChecklistSummaryQuery(
        Long id,
        String name,
        CheckStage stage,
        int itemCount) {
}
