package com.jachwisunbae.transit.provider.gtfs.sample;

import java.util.HashSet;
import java.util.Set;

// 대상 노선의 운행이 실제로 지나는 정류장만 남기기 위한 목록이다.
public class UsedStops {

    private final Set<String> stopIds = new HashSet<>();

    void add(final String stopId) {
        stopIds.add(stopId);
    }

    public boolean contains(final String stopId) {
        return stopIds.contains(stopId);
    }
}
