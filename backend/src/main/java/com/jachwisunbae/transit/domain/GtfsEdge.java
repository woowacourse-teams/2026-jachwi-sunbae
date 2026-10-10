package com.jachwisunbae.transit.domain;

import com.jachwisunbae.transit.domain.vo.Seconds;

// 같은 노선에서 연속한 두 정류장 사이의 이동 시간이다.
public record GtfsEdge(String routeId, String fromStopId, String toStopId, Seconds travelTime) {

    public GtfsEdge withTravelTime(final Seconds newTravelTime) {
        return new GtfsEdge(routeId, fromStopId, toStopId, newTravelTime);
    }

    public String segmentKey() {
        return routeId + '\0' + fromStopId + '\0' + toStopId;
    }
}
