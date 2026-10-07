package com.jachwisunbae.transit.provider.gtfs;

import com.jachwisunbae.transit.domain.GtfsEdge;

record StopArrival(String stopId, int arrivalSeconds) {

    // 시각표상 같은 분에 도착하는 구간도 실제로는 이동 시간이 있으므로 최소 30초로 본다.
    private static final int MINIMUM_TRAVEL_SECONDS = 30;

    boolean isSameStop(final StopArrival other) {
        return other.stopId.equals(stopId);
    }

    GtfsEdge edgeTo(final StopArrival next, final String routeId) {
        int travelSeconds = Math.max(MINIMUM_TRAVEL_SECONDS, next.arrivalSeconds - arrivalSeconds);
        return new GtfsEdge(routeId, stopId, next.stopId, travelSeconds);
    }
}
