package com.jachwisunbae.map.provider;

import com.jachwisunbae.map.domain.MapAddress;
import java.math.BigDecimal;
import java.util.List;

public interface AddressProvider {
    List<MapAddress> geocode(String query);

    MapAddress reverseGeocode(BigDecimal latitude, BigDecimal longitude);
}
