package com.jachwisunbae.map.domain;

import java.math.BigDecimal;

// 매물에 저장할 주소와 좌표. 도로명주소를 기준 주소로 삼고, 지번 주소는 있을 때만 채운다.
public record MapAddress(String roadAddress, String jibunAddress,
                         BigDecimal latitude, BigDecimal longitude) {

    public MapAddress {
        if (roadAddress == null || roadAddress.isBlank()) {
            throw new IllegalArgumentException("도로명주소가 필요합니다.");
        }
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("주소의 위도와 경도가 필요합니다.");
        }
    }
}
