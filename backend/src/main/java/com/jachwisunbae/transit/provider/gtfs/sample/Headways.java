package com.jachwisunbae.transit.provider.gtfs.sample;

import com.jachwisunbae.transit.domain.DepartureSchedule;
import com.jachwisunbae.transit.domain.GtfsRoute;
import com.jachwisunbae.transit.domain.Seconds;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class Headways {

    private final Map<String, List<Integer>> departuresByRoute = new HashMap<>();

    public void add(final String routeId, final int departureSeconds) {
        departuresByRoute.computeIfAbsent(routeId, ignored -> new ArrayList<>()).add(departureSeconds);
    }

    public List<GtfsRoute> applyTo(final List<GtfsRoute> routes) {
        return routes.stream()
                .map(route -> route.withWaitTime(waitTimeOf(route.routeId())))
                .toList();
    }

    private Seconds waitTimeOf(final String routeId) {
        return Optional.ofNullable(departuresByRoute.get(routeId))
                .map(departures -> new DepartureSchedule(departures).waitTime())
                .orElse(GtfsRoute.DEFAULT_WAIT_TIME);
    }
}
