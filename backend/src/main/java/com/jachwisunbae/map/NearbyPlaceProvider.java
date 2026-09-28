package com.jachwisunbae.map;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

public interface NearbyPlaceProvider {
    List<NearbyPlace> nearby(BigDecimal latitude, BigDecimal longitude, int radius, Set<MapCategory> categories);
}
