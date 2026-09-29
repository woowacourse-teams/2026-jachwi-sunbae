package com.jachwisunbae.map.service.dto.result;

import com.jachwisunbae.map.domain.NearbyPlace;
import com.jachwisunbae.map.type.MapCategory;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record NearbyResult(BigDecimal latitude, BigDecimal longitude, int radius,
                           Map<MapCategory, Integer> counts, List<NearbyPlace> places) {
}
