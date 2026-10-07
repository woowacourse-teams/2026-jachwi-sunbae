package com.jachwisunbae.transit.provider.gtfs.sample;

import com.jachwisunbae.transit.domain.GtfsEdge;
import com.jachwisunbae.transit.domain.Seconds;
import com.jachwisunbae.transit.domain.TravelTimeSamples;

public class EdgeTimes {

    private final GtfsEdge segment;
    private final TravelTimeSamples samples = new TravelTimeSamples();

    public EdgeTimes(final GtfsEdge segment) {
        this.segment = segment;
    }

    public void add(final Seconds travelTime) {
        samples.add(travelTime);
    }

    public GtfsEdge toMedianEdge() {
        return segment.withTravelTime(samples.median());
    }
}
