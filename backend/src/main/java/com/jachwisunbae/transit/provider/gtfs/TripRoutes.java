package com.jachwisunbae.transit.provider.gtfs;

import com.jachwisunbae.transit.domain.GtfsRoute;
import com.jachwisunbae.transit.provider.gtfs.sample.StopTimeSamples;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

class TripRoutes {

    private final Map<String, String> routeIdsByTrip = new HashMap<>();

    static TripRoutes read(final GtfsFiles files, final List<GtfsRoute> routes) {
        Set<String> routeIds = routes.stream()
                .map(GtfsRoute::routeId)
                .collect(Collectors.toSet());
        TripRoutes tripRoutes = new TripRoutes();
        files.forEach("trips.txt", record -> tripRoutes.addIfServed(record, routeIds));
        return tripRoutes;
    }

    StopTimeSamples collectStopTimes(final GtfsFiles files) {
        StopTimeCollector collector = new StopTimeCollector();
        files.forEach("stop_times.txt", record -> routeOf(record)
                .ifPresent(routeId -> collector.accept(routeId, record)));
        return collector.samples();
    }

    private void addIfServed(final GtfsRecord record, final Set<String> routeIds) {
        String routeId = record.text("route_id");
        if (routeIds.contains(routeId)) {
            routeIdsByTrip.put(record.text("trip_id"), routeId);
        }
    }

    private Optional<String> routeOf(final GtfsRecord record) {
        return Optional.ofNullable(routeIdsByTrip.get(record.text("trip_id")));
    }
}
