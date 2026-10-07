package com.jachwisunbae.transit.provider.gtfs.sample;

import com.jachwisunbae.transit.domain.GtfsEdge;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

class SegmentSamples {

    private final Map<String, EdgeTimes> timesBySegment = new LinkedHashMap<>();

    void add(final GtfsEdge sample) {
        timesBySegment.computeIfAbsent(sample.segmentKey(), ignored -> new EdgeTimes(sample))
                .add(sample.seconds());
    }

    List<GtfsEdge> medianEdges() {
        return timesBySegment.values().stream()
                .map(EdgeTimes::toMedianEdge)
                .toList();
    }
}
