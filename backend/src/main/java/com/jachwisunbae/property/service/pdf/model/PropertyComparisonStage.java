package com.jachwisunbae.property.service.pdf.model;

import com.jachwisunbae.property.controller.dto.response.PropertyChecklistStageResponse;
import com.jachwisunbae.property.repository.query.PropertyChecklistApplicationQuery;

public record PropertyComparisonStage(PropertyChecklistStageResponse summary,
                                      PropertyChecklistApplicationQuery application) {
}
