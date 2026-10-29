package com.jachwisunbae.transit.domain.vo;

public record Coordinate(double latitude, double longitude) {

    private static final double EARTH_RADIUS_METERS = 6_371_000;

    public Coordinate {
        if (!(latitude >= -90 && latitude <= 90)) {
            throw new IllegalArgumentException("위도는 -90 이상 90 이하여야 합니다. latitude=" + latitude);
        }
        if (!(longitude >= -180 && longitude <= 180)) {
            throw new IllegalArgumentException("경도는 -180 이상 180 이하여야 합니다. longitude=" + longitude);
        }
    }

    public double metersTo(final Coordinate other) {
        double fromLatitude = Math.toRadians(latitude);
        double toLatitude = Math.toRadians(other.latitude);
        double deltaLatitude = toLatitude - fromLatitude;
        double deltaLongitude = Math.toRadians(other.longitude - longitude);
        double haversine = Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2)
                + Math.cos(fromLatitude) * Math.cos(toLatitude)
                * Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2);
        return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
    }
}
