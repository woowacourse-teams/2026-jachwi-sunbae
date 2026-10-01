package com.jachwisunbae.map.domain;

import java.math.BigDecimal;
import lombok.Getter;

// 위도·경도 범위로 만든 사각형. 경계값을 포함한다.
@Getter
public class CoordinateBounds {

    private final BigDecimal minLatitude;
    private final BigDecimal maxLatitude;
    private final BigDecimal minLongitude;
    private final BigDecimal maxLongitude;

    private CoordinateBounds(BigDecimal minLatitude, BigDecimal maxLatitude,
                             BigDecimal minLongitude, BigDecimal maxLongitude) {
        this.minLatitude = minLatitude;
        this.maxLatitude = maxLatitude;
        this.minLongitude = minLongitude;
        this.maxLongitude = maxLongitude;
    }

    public static CoordinateBounds of(BigDecimal minLatitude, BigDecimal maxLatitude,
                                      BigDecimal minLongitude, BigDecimal maxLongitude) {
        validateRange(minLatitude, maxLatitude, "위도 범위가 올바르지 않습니다.");
        validateRange(minLongitude, maxLongitude, "경도 범위가 올바르지 않습니다.");
        return new CoordinateBounds(minLatitude, maxLatitude, minLongitude, maxLongitude);
    }

    private static void validateRange(BigDecimal min, BigDecimal max, String message) {
        if (min == null || max == null || min.compareTo(max) > 0) {
            throw new IllegalArgumentException(message);
        }
    }
}
