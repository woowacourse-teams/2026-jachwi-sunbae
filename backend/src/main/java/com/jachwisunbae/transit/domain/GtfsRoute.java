package com.jachwisunbae.transit.domain;

import com.jachwisunbae.transit.domain.vo.Seconds;

public record GtfsRoute(String routeId, String shortName, String longName, int routeType, Seconds waitTime) {

    public static final Seconds DEFAULT_WAIT_TIME = new Seconds(300);

    public GtfsRoute withWaitTime(final Seconds newWaitTime) {
        return new GtfsRoute(routeId, shortName, longName, routeType, newWaitTime);
    }
}
