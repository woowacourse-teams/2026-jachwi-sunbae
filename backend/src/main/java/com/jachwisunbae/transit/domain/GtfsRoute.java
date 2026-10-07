package com.jachwisunbae.transit.domain;

// GTFS routes.txt의 한 노선이다. 탑승 대기 시간은 운행 간격으로 계산해 채운다.
public record GtfsRoute(String routeId, String shortName, String longName, int routeType, int waitSeconds) {

    public static final int DEFAULT_WAIT_SECONDS = 300;

    public GtfsRoute withWaitSeconds(final int newWaitSeconds) {
        return new GtfsRoute(routeId, shortName, longName, routeType, newWaitSeconds);
    }
}
