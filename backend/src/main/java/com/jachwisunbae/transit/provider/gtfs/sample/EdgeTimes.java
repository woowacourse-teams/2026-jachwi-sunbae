package com.jachwisunbae.transit.provider.gtfs.sample;

import com.jachwisunbae.transit.domain.GtfsEdge;
import com.jachwisunbae.transit.domain.Seconds;
import com.jachwisunbae.transit.domain.TravelTimeSamples;

class EdgeTimes {

    private final GtfsEdge segment;
    private final TravelTimeSamples samples = new TravelTimeSamples();

    EdgeTimes(final GtfsEdge segment) {
        this.segment = segment;
    }

    void add(final Seconds travelTime) {
        samples.add(travelTime);
    }

    GtfsEdge toMedianEdge() {
        return segment.withTravelTime(samples.median());
    }
}
