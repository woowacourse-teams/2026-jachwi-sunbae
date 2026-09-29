package com.jachwisunbae.map.controller.dto.response;

import com.jachwisunbae.map.domain.NearbyPlace;
import com.jachwisunbae.map.type.MapCategory;
import java.math.BigDecimal;

public record NearbyPlaceResponse(String providerPlaceId, String name, MapCategory category, String address,
                                  BigDecimal latitude, BigDecimal longitude, int distanceMeters) {

    public static NearbyPlaceResponse from(NearbyPlace place) {
        return new NearbyPlaceResponse(place.providerPlaceId(), place.name(), place.category(), place.address(),
                place.latitude(), place.longitude(), place.distanceMeters());
    }
}
