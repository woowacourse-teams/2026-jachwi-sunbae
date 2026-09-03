package com.jachwisunbae.property.controller.dto.response;

import com.jachwisunbae.property.entity.Property;
import com.jachwisunbae.property.entity.PropertyPhoto;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

public record PropertyDetailResponse(
    Long id,
    String name,
    Long depositAmount,
    Long monthlyRentAmount,
    String discoverySource,
    String address,
    BigDecimal latitude,
    BigDecimal longitude,
    int photoCount,
    List<PropertyDetailPhoto> photos,
    PropertyRepresentativePhoto representativePhoto,
    PropertyProgress overallProgress,
    Instant createdAt,
    Instant updatedAt
) {
    public static PropertyDetailResponse from(final Property property,
                                              final List<PropertyPhoto> photos,
                                              final Long representativePhotoId,
                                              final PropertyProgress progress) {
        PropertyPhoto representative = photos.stream()
            .filter(photo -> photo.getId().equals(representativePhotoId))
            .findFirst()
            .orElse(null);

        return new PropertyDetailResponse(
            property.getId(),
            property.getName(),
            property.getDepositAmount(),
            property.getMonthlyRentAmount(),
            property.getDiscoverySource(),
            property.getAddress(),
            property.getLatitude(),
            property.getLongitude(),
            photos.size(),
            photos.stream()
                .map(photo -> PropertyDetailPhoto.from(photo, photo.getId().equals(representativePhotoId)))
                .toList(),
            representative == null ? null : new PropertyRepresentativePhoto(
                representative.getId(),
                "/api/properties/" + property.getId() + "/photos/" + representative.getId(),
                representative.getContentType()),
            progress,
            property.getCreatedAt().toInstant(ZoneOffset.UTC),
            property.getUpdatedAt().toInstant(ZoneOffset.UTC)
        );
    }
}
