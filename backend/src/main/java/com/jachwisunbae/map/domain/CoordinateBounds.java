package com.jachwisunbae.map.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;
import lombok.Getter;

// 위도·경도 범위로 만든 사각형. 경계값을 포함한다.
@Getter
public class CoordinateBounds {

    private static final int SCALE = 7;
    private static final BigDecimal MAX_LATITUDE = BigDecimal.valueOf(90);
    private static final BigDecimal MAX_LONGITUDE = BigDecimal.valueOf(180);
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

    // 중심 좌표에서 반경 거리의 원을 감싸는 가장 작은 사각형을 만든다. 원보다 넓으므로 실제 거리로 다시 걸러야 한다.
    // 거리 계산(GeoDistance)과 같은 구면 모델을 써야 반경 경계의 좌표가 사각형 밖으로 빠지지 않는다.
    // 경도 폭은 위도가 높을수록 넓어진다. 극에 가까워 원이 극을 덮으면 경도 전체를 쓴다.
    // 좌표 범위를 넘으면 경계에서 자른다. 날짜변경선을 넘는 범위는 다루지 않는다.
    public static CoordinateBounds around(BigDecimal latitude, BigDecimal longitude, int radiusMeters) {
        if (latitude == null || longitude == null || radiusMeters <= 0) {
            throw new IllegalArgumentException("중심 좌표와 양수 반경이 필요합니다.");
        }
        double angularRadius = radiusMeters / GeoDistance.EARTH_RADIUS_METERS;
        double latitudeDelta = Math.toDegrees(angularRadius);
        double ratio = Math.sin(angularRadius) / Math.cos(Math.toRadians(latitude.doubleValue()));
        double longitudeDelta = ratio >= 1 ? MAX_LONGITUDE.doubleValue() : Math.toDegrees(Math.asin(ratio));
        return of(lowerBound(latitude, latitudeDelta, MAX_LATITUDE),
                upperBound(latitude, latitudeDelta, MAX_LATITUDE),
                lowerBound(longitude, longitudeDelta, MAX_LONGITUDE),
                upperBound(longitude, longitudeDelta, MAX_LONGITUDE));
    }

    // 경계에 걸친 좌표를 놓치지 않도록 최솟값은 내림, 최댓값은 올림한다.
    private static BigDecimal lowerBound(BigDecimal center, double delta, BigDecimal limit) {
        BigDecimal value = center.subtract(BigDecimal.valueOf(delta)).setScale(SCALE, RoundingMode.FLOOR);
        return value.max(limit.negate());
    }

    private static BigDecimal upperBound(BigDecimal center, double delta, BigDecimal limit) {
        BigDecimal value = center.add(BigDecimal.valueOf(delta)).setScale(SCALE, RoundingMode.CEILING);
        return value.min(limit);
    }

    private static void validateRange(BigDecimal min, BigDecimal max, String message) {
        if (min == null || max == null || min.compareTo(max) > 0) {
            throw new IllegalArgumentException(message);
        }
    }
}
