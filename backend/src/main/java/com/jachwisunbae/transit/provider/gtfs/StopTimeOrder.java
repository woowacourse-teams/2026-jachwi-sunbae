package com.jachwisunbae.transit.provider.gtfs;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.InternalSystemException;
import java.util.HashSet;
import java.util.Set;

// GTFS 표준은 stop_times.txt의 행 순서를 보장하지 않는다. KTDB 2025-03 데이터는 운행편별로 모여 있고
// stop_sequence가 증가하지만, 다른 데이터에서 전제가 깨지면 틀린 구간을 만드는 대신 적재를 멈춘다.
public class StopTimeOrder {

    private final Set<String> startedTripIds = new HashSet<>();
    private String currentTripId;
    private int lastStopSequence;

    public void check(final String tripId, final int stopSequence) {
        if (tripId.equals(currentTripId)) {
            requireIncreasing(tripId, stopSequence);
            lastStopSequence = stopSequence;
            return;
        }
        if (!startedTripIds.add(tripId)) {
            throw unordered("운행편의 정차 기록이 한곳에 모여 있지 않습니다. trip_id=" + tripId);
        }
        currentTripId = tripId;
        lastStopSequence = stopSequence;
    }

    private void requireIncreasing(final String tripId, final int stopSequence) {
        if (stopSequence <= lastStopSequence) {
            throw unordered("stop_sequence가 증가하지 않습니다. trip_id=" + tripId
                    + ", " + lastStopSequence + " -> " + stopSequence);
        }
    }

    private InternalSystemException unordered(final String detail) {
        return new InternalSystemException(ErrorCode.TRANSIT_FEED_READ_FAILURE,
                "stop_times.txt 정렬 전제가 깨졌습니다. " + detail);
    }
}
