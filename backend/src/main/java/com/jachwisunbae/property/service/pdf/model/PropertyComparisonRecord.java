package com.jachwisunbae.property.service.pdf.model;

import com.jachwisunbae.property.entity.Property;
import com.jachwisunbae.property.entity.PropertyMemo;
import java.util.List;

public record PropertyComparisonRecord(
        Property property,
        List<PropertyComparisonPhoto> photos,
        PropertyMemo memo,
        List<PropertyComparisonStage> stages) {
}
