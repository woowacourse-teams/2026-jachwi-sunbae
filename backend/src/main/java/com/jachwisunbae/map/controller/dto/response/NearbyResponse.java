package com.jachwisunbae.map.controller.dto.response;

import com.jachwisunbae.map.service.dto.result.NearbyResult;
import com.jachwisunbae.map.type.MapCategory;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record NearbyResponse(Center center, int radius, Map<MapCategory, Integer> counts,
                             List<NearbyPlaceResponse> places) {

    public static NearbyResponse from(NearbyResult result) {
        return new NearbyResponse(new Center(result.latitude(), result.longitude()), result.radius(),
                result.counts(), result.places().stream().map(NearbyPlaceResponse::from).toList());
    }

    public record Center(BigDecimal latitude, BigDecimal longitude) {
    }
}
