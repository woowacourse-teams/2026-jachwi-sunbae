package com.jachwisunbae.transit.provider.gtfs.aggregation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.InternalSystemException;
import com.jachwisunbae.transit.domain.GtfsEdge;
import com.jachwisunbae.transit.domain.GtfsRoute;
import com.jachwisunbae.transit.domain.vo.Seconds;
import com.jachwisunbae.transit.provider.gtfs.GtfsFiles;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

// 운행편 T로 시작하는 trip_id는 모두 노선 R1로 본다.
class StopTimeAccumulatorTest {

    private static final String HEADER = "trip_id,arrival_time,departure_time,stop_id,stop_sequence\n";
    private static final String ROUTE_ID = "R1";

    @TempDir
    private Path directory;

    private final StopTimeAccumulator accumulator = new StopTimeAccumulator();

    @Test
    @DisplayName("구간 이동 시간은 운행마다 잰 값의 중앙값이고, 같은 분에 도착해도 최소 30초로 본다")
    void buildsMedianEdgesWithMinimumTravelTime() throws IOException {
        // when
        accumulate(HEADER + """
                T1,08:00:00,08:00:00,P0,1
                T1,08:02:00,08:02:00,P1,2
                T1,08:02:00,08:02:00,P2,3
                T2,08:20:00,08:20:00,P0,1
                T2,08:21:00,08:21:00,P1,2
                T3,08:40:00,08:40:00,P0,1
                T3,08:45:00,08:45:00,P1,2
                """);

        // then
        assertThat(accumulator.medianEdges()).containsExactly(
                new GtfsEdge(ROUTE_ID, "P0", "P1", new Seconds(120)),
                new GtfsEdge(ROUTE_ID, "P1", "P2", new Seconds(30)));
        assertThat(accumulator.usedStopIds()).containsExactlyInAnyOrder("P0", "P1", "P2");
    }

    @Test
    @DisplayName("대기 시간은 첫 정류장 출발 간격 중앙값의 절반이다")
    void estimatesWaitTimeFromDepartures() throws IOException {
        // when
        accumulate(HEADER + """
                T1,08:00:00,08:00:00,P0,1
                T2,08:20:00,08:20:00,P0,1
                T3,08:40:00,08:40:00,P0,1
                """);

        // then
        assertThat(accumulator.waitTimeOf(ROUTE_ID)).isEqualTo(new Seconds(600));
    }

    @Test
    @DisplayName("운행편이 없는 노선은 기본 대기 시간을 쓴다")
    void usesDefaultWaitTimeWithoutDepartures() {
        // when // then
        assertThat(accumulator.waitTimeOf("UNKNOWN")).isEqualTo(GtfsRoute.DEFAULT_WAIT_TIME);
    }

    @Test
    @DisplayName("같은 정류장에 연달아 정차하면 구간을 만들지 않는다")
    void skipsRepeatedStop() throws IOException {
        // when
        accumulate(HEADER + """
                T1,08:00:00,08:00:00,P0,1
                T1,08:03:00,08:03:00,P0,2
                T1,08:05:00,08:05:00,P1,3
                """);

        // then
        assertThat(accumulator.medianEdges()).containsExactly(new GtfsEdge(ROUTE_ID, "P0", "P1", new Seconds(120)));
    }

    @Test
    @DisplayName("운행편의 정차 기록이 흩어져 있으면 적재를 멈춘다")
    void rejectsScatteredTrip() {
        // when // then
        assertThatThrownBy(() -> accumulate(HEADER + """
                T1,08:00:00,08:00:00,P0,1
                T2,08:20:00,08:20:00,P0,1
                T1,08:02:00,08:02:00,P1,2
                """))
                .isInstanceOf(InternalSystemException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TRANSIT_FEED_READ_FAILURE)
                .hasMessageContaining("trip_id=T1");
    }

    @Test
    @DisplayName("stop_sequence가 증가하지 않으면 적재를 멈춘다")
    void rejectsNonIncreasingSequence() {
        // when // then
        assertThatThrownBy(() -> accumulate(HEADER + """
                T1,08:00:00,08:00:00,P0,2
                T1,08:02:00,08:02:00,P1,2
                """))
                .isInstanceOf(InternalSystemException.class)
                .hasMessageContaining("stop_sequence가 증가하지 않습니다");
    }

    private void accumulate(final String stopTimes) throws IOException {
        Files.writeString(directory.resolve("stop_times.txt"), stopTimes, StandardCharsets.UTF_8);
        new GtfsFiles(directory).forEach("stop_times.txt", record -> accumulator.add(ROUTE_ID, record));
    }
}
