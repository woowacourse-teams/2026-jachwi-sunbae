package com.jachwisunbae.transit.provider.gtfs;

import com.jachwisunbae.transit.domain.GtfsEdge;
import java.util.Optional;

public record StopVisit(String tripId, StopArrival arrival) {

    public static final StopVisit NONE = new StopVisit(null, new StopArrival(null, 0));

    public boolean isOtherTrip(final StopVisit next) {
        return !next.tripId.equals(tripId);
    }

    public Optional<GtfsEdge> edgeTo(final StopVisit next, final String routeId) {
        if (isOtherTrip(next) || arrival.isSameStop(next.arrival)) {
            return Optional.empty();
        }
        return Optional.of(arrival.edgeTo(next.arrival, routeId));
    }
}
