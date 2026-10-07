package com.jachwisunbae.transit.provider.gtfs.sample;

import com.jachwisunbae.transit.domain.GtfsEdge;
import com.jachwisunbae.transit.domain.TravelTimeSamples;

class EdgeTimes {

    private final GtfsEdge segment;
    private final TravelTimeSamples samples = new TravelTimeSamples();

    EdgeTimes(final GtfsEdge segment) {
        this.segment = segment;
    }

    void add(final int seconds) {
        samples.add(seconds);
    }

    GtfsEdge toMedianEdge() {
        return segment.withSeconds(samples.median());
    }
}
