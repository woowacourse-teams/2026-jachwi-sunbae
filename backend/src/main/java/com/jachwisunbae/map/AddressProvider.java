package com.jachwisunbae.map;

import java.math.BigDecimal;
import java.util.List;

public interface AddressProvider {
    List<MapAddress> geocode(String query);

    MapAddress reverseGeocode(BigDecimal latitude, BigDecimal longitude);
}
