package com.jachwisunbae.property.service.pdf.model;

public record PropertyComparisonPhoto(Long id, byte[] bytes, String contentType, boolean representative) {
    public PropertyComparisonPhoto {
        bytes = bytes.clone();
    }

    @Override
    public byte[] bytes() {
        return bytes.clone();
    }
}
