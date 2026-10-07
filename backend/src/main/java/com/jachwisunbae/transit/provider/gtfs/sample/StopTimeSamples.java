package com.jachwisunbae.transit.provider.gtfs.sample;

import com.jachwisunbae.transit.domain.GtfsEdge;
import com.jachwisunbae.transit.domain.GtfsRoute;
import java.util.List;

// stop_times.txt를 한 번 읽으며 정류장, 구간 이동 시간, 노선 출발 시각을 모은다.
public class StopTimeSamples {

    private final UsedStops stops = new UsedStops();
    private final RouteSamples routes = new RouteSamples();

    public void visit(final String stopId) {
        stops.add(stopId);
    }

    public void travel(final GtfsEdge sample) {
        routes.travel(sample);
    }

    public void depart(final String routeId, final int departureSeconds) {
        routes.depart(routeId, departureSeconds);
    }

    public UsedStops usedStops() {
        return stops;
    }

    public List<GtfsEdge> medianEdges() {
        return routes.medianEdges();
    }

    public List<GtfsRoute> applyWaits(final List<GtfsRoute> gtfsRoutes) {
        return routes.applyWaits(gtfsRoutes);
    }
}
