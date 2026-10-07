package com.jachwisunbae.transit.provider.gtfs;

import com.jachwisunbae.transit.provider.gtfs.sample.StopTimeSamples;

// stop_times.txt는 운행(trip)별·정차 순서별로 정렬되어 있어 직전 정차와 비교해 구간을 만든다.
class StopTimeCollector {

    private final StopTimeSamples samples = new StopTimeSamples();
    private StopVisit previous = StopVisit.NONE;

    void accept(final String routeId, final GtfsRecord record) {
        String stopId = record.text("stop_id");
        samples.visit(stopId);
        StopArrival arrival = new StopArrival(stopId, record.seconds("arrival_time"));
        StopVisit current = new StopVisit(record.text("trip_id"), arrival);
        if (previous.isOtherTrip(current)) {
            samples.depart(routeId, record.seconds("departure_time"));
        }
        previous.edgeTo(current, routeId).ifPresent(samples::travel);
        previous = current;
    }

    StopTimeSamples samples() {
        return samples;
    }
}
