package com.jachwisunbae.transit.domain;

import com.jachwisunbae.transit.domain.vo.Seconds;

public record GtfsEdge(String routeId, String fromStopId, String toStopId, Seconds travelTime) {
}
