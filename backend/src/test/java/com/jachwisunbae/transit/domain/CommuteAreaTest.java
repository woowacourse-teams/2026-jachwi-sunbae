package com.jachwisunbae.transit.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.jachwisunbae.transit.domain.vo.Coordinate;
import com.jachwisunbae.transit.domain.vo.Seconds;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CommuteAreaTest {

    private static final String DONG = "11000001";

    @Test
    @DisplayName("[POL-COMMUTE-015] 같은 이름의 정류장은 가장 빠른 하나만 남기고 순서를 유지한다")
    void keepsFastestStationPerName() {
        CommuteArea area = new CommuteArea(DONG, List.of(
                station("A1", "판교역서편", 120),
                station("B1", "낙생지하차도", 180),
                station("A2", "판교역서편", 150),
                station("B2", "낙생지하차도", 180),
                station("C1", "화랑공원남편", 300)));

        assertThat(area.stations()).extracting(stop -> stop.stop().stopId()).containsExactly("A1", "B1", "C1");
        assertThat(area.commuteMinutes()).isEqualTo(2);
    }

    private static ReachableStop station(final String id, final String name, final int seconds) {
        return new ReachableStop(new GtfsStop(id, name, new Coordinate(37.5, 127.0), DONG), new Seconds(seconds));
    }
}
