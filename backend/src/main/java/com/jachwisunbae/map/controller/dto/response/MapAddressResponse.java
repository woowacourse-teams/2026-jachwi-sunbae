package com.jachwisunbae.map.controller.dto.response;

import com.jachwisunbae.map.domain.MapAddress;
import java.math.BigDecimal;

public record MapAddressResponse(String roadAddress, String jibunAddress,
                                 BigDecimal latitude, BigDecimal longitude) {

    public static MapAddressResponse from(MapAddress address) {
        return new MapAddressResponse(address.roadAddress(), address.jibunAddress(),
                address.latitude(), address.longitude());
    }
}
