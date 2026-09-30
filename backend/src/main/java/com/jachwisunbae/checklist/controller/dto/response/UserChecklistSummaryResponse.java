package com.jachwisunbae.checklist.controller.dto.response;

import com.jachwisunbae.checklist.repository.query.UserChecklistSummaryQuery;
import com.jachwisunbae.checklist.type.CheckStage;

public record UserChecklistSummaryResponse(Long id, String name, CheckStage stage, int itemCount) {
    public static UserChecklistSummaryResponse from(final UserChecklistSummaryQuery summary) {
        return new UserChecklistSummaryResponse(
            summary.id(), summary.name(), summary.stage(), summary.itemCount());
    }
}
