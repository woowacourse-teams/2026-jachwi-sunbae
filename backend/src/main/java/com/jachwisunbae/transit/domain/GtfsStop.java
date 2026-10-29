package com.jachwisunbae.transit.domain;

import com.jachwisunbae.transit.domain.vo.Coordinate;

public record GtfsStop(String stopId, String stopName, Coordinate coordinate, String adminDongCode) {

    public GtfsStop(final String stopId, final String stopName, final Coordinate coordinate) {
        this(stopId, stopName, coordinate, null);
    }

    public GtfsStop withAdminDongCode(final String newAdminDongCode) {
        return new GtfsStop(stopId, stopName, coordinate, newAdminDongCode);
    }
}
