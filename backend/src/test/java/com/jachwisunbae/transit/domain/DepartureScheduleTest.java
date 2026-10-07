package com.jachwisunbae.transit.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class DepartureScheduleTest {

    @Test
    @DisplayName("운행 간격 중앙값의 절반을 탑승 대기 시간으로 쓴다")
    void usesHalfOfMedianHeadway() {
        DepartureSchedule schedule = new DepartureSchedule(List.of(28_800, 30_000, 31_200, 30_000));

        assertThat(schedule.waitSeconds()).isEqualTo(600);
    }

    @Test
    @DisplayName("대기 시간은 2분 이상 15분 이하로 제한한다")
    void clampsWaitSeconds() {
        assertThat(new DepartureSchedule(List.of(0, 120, 240)).waitSeconds()).isEqualTo(120);
        assertThat(new DepartureSchedule(List.of(0, 7_200)).waitSeconds()).isEqualTo(900);
    }

    @Test
    @DisplayName("쓸 수 있는 운행 간격이 없으면 10분 간격으로 보고 5분을 기다린다")
    void usesDefaultHeadwayWithoutUsableGaps() {
        assertThat(new DepartureSchedule(List.of(28_800)).waitSeconds()).isEqualTo(300);
        assertThat(new DepartureSchedule(List.of(0, 30, 10_000)).waitSeconds()).isEqualTo(300);
    }
}
