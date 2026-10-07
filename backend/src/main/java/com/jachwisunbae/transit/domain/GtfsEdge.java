package com.jachwisunbae.transit.domain;

// 같은 노선에서 연속한 두 정류장 사이의 이동 시간이다.
public record GtfsEdge(String routeId, String fromStopId, String toStopId, int seconds) {

    public GtfsEdge withSeconds(final int newSeconds) {
        return new GtfsEdge(routeId, fromStopId, toStopId, newSeconds);
    }

    public String segmentKey() {
        return routeId + '\0' + fromStopId + '\0' + toStopId;
    }
}
