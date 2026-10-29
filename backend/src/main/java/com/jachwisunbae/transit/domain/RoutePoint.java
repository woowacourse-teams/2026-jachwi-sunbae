package com.jachwisunbae.transit.domain;

import com.jachwisunbae.transit.domain.vo.Coordinate;

public record RoutePoint(String stopId, String name, Coordinate coordinate) {

    private static final String DESTINATION_NAME = "목적지";

    public static RoutePoint of(final GtfsStop stop) {
        return new RoutePoint(stop.stopId(), stop.stopName(), stop.coordinate());
    }

    public static RoutePoint destination(final Coordinate coordinate) {
        return new RoutePoint(null, DESTINATION_NAME, coordinate);
    }
}
