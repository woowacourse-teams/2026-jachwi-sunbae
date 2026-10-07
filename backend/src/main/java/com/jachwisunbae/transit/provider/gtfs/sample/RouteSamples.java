package com.jachwisunbae.transit.provider.gtfs.sample;

import com.jachwisunbae.transit.domain.GtfsEdge;
import com.jachwisunbae.transit.domain.GtfsRoute;
import java.util.List;

public class RouteSamples {

    private final SegmentSamples segments = new SegmentSamples();
    private final Headways headways = new Headways();

    public void travel(final GtfsEdge sample) {
        segments.add(sample);
    }

    public void depart(final String routeId, final int departureSeconds) {
        headways.add(routeId, departureSeconds);
    }

    public List<GtfsEdge> medianEdges() {
        return segments.medianEdges();
    }

    public List<GtfsRoute> applyWaits(final List<GtfsRoute> routes) {
        return headways.applyTo(routes);
    }
}
