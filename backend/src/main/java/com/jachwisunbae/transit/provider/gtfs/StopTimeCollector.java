package com.jachwisunbae.transit.provider.gtfs;

import com.jachwisunbae.transit.provider.gtfs.sample.StopTimeSamples;

// stop_times.txt를 한 번만 읽으며 직전 정차와 비교해 구간을 만든다.
// 운행(trip)별로 모여 있고 정차 순서가 증가한다는 전제는 StopTimeOrder가 확인한다.
public class StopTimeCollector {

    private final StopTimeSamples samples = new StopTimeSamples();
    private final StopTimeOrder order = new StopTimeOrder();
    private StopVisit previous = StopVisit.NONE;

    public void accept(final String routeId, final GtfsRecord record) {
        order.check(record.text("trip_id"), record.integer("stop_sequence"));
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

    public StopTimeSamples samples() {
        return samples;
    }
}
