package com.jachwisunbae.transit.provider.gtfs.sample;

import com.jachwisunbae.transit.domain.DepartureSchedule;
import com.jachwisunbae.transit.domain.GtfsRoute;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

class Headways {

    private final Map<String, List<Integer>> departuresByRoute = new HashMap<>();

    void add(final String routeId, final int departureSeconds) {
        departuresByRoute.computeIfAbsent(routeId, ignored -> new ArrayList<>()).add(departureSeconds);
    }

    List<GtfsRoute> applyTo(final List<GtfsRoute> routes) {
        return routes.stream()
                .map(route -> route.withWaitSeconds(waitSecondsOf(route.routeId())))
                .toList();
    }

    private int waitSecondsOf(final String routeId) {
        return Optional.ofNullable(departuresByRoute.get(routeId))
                .map(departures -> new DepartureSchedule(departures).waitSeconds())
                .orElse(GtfsRoute.DEFAULT_WAIT_SECONDS);
    }
}
