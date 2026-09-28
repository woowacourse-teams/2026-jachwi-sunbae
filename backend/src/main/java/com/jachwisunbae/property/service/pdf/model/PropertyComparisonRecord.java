package com.jachwisunbae.property.service.pdf.model;

import com.jachwisunbae.property.entity.Property;
import java.util.List;

public record PropertyComparisonRecord(
        Property property,
        List<PropertyComparisonPhoto> photos,
        String memo,
        List<PropertyComparisonStage> stages) {
}
