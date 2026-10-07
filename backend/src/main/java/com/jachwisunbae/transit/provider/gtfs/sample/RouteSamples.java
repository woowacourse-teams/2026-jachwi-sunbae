package com.jachwisunbae.transit.provider.gtfs.sample;

import com.jachwisunbae.transit.domain.GtfsEdge;
import com.jachwisunbae.transit.domain.GtfsRoute;
import java.util.List;

class RouteSamples {

    private final SegmentSamples segments = new SegmentSamples();
    private final Headways headways = new Headways();

    void travel(final GtfsEdge sample) {
        segments.add(sample);
    }

    void depart(final String routeId, final int departureSeconds) {
        headways.add(routeId, departureSeconds);
    }

    List<GtfsEdge> medianEdges() {
        return segments.medianEdges();
    }

    List<GtfsRoute> applyWaits(final List<GtfsRoute> routes) {
        return headways.applyTo(routes);
    }
}
