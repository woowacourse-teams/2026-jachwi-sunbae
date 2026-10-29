package com.jachwisunbae.transit.domain;

import com.jachwisunbae.transit.domain.vo.Seconds;

// 통근 시간은 대기·환승 시간과 도착 정류장에서 목적지까지 걷는 시간을 포함한다.
public record ReachableStop(GtfsStop stop, Seconds travelTime) {

    public int travelMinutes() {
        return (travelTime.value() + 59) / 60;
    }

    public String adminDongCode() {
        return stop.adminDongCode();
    }
}
