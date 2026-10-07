package com.jachwisunbae.transit.domain;

import java.util.List;
import java.util.stream.IntStream;

// 노선의 첫 정류장 출발 시각으로 평균 탑승 대기 시간을 추정한다.
// 대기 시간은 운행 간격 중앙값의 절반이며, 1분 미만·2시간 초과 간격은 이상값으로 보고 제외한다.
public class DepartureSchedule {

    private static final int MINIMUM_GAP_SECONDS = 60;
    private static final int MAXIMUM_GAP_SECONDS = 7200;
    private static final int DEFAULT_HEADWAY_SECONDS = 600;
    private static final int MINIMUM_WAIT_SECONDS = 120;
    private static final int MAXIMUM_WAIT_SECONDS = 900;

    private final List<Integer> departureSeconds;

    public DepartureSchedule(final List<Integer> departureSeconds) {
        this.departureSeconds = departureSeconds;
    }

    public Seconds waitTime() {
        List<Integer> gaps = gaps();
        int medianHeadway = gaps.isEmpty() ? DEFAULT_HEADWAY_SECONDS : gaps.get(gaps.size() / 2);
        return new Seconds(Math.max(MINIMUM_WAIT_SECONDS, Math.min(MAXIMUM_WAIT_SECONDS, medianHeadway / 2)));
    }

    private List<Integer> gaps() {
        List<Integer> sorted = departureSeconds.stream().distinct().sorted().toList();
        return IntStream.range(1, sorted.size())
                .map(index -> sorted.get(index) - sorted.get(index - 1))
                .filter(gap -> gap >= MINIMUM_GAP_SECONDS && gap <= MAXIMUM_GAP_SECONDS)
                .sorted()
                .boxed()
                .toList();
    }
}
