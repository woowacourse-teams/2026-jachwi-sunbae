package com.jachwisunbae.transit.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TravelTimeSamplesTest {

    @Test
    @DisplayName("홀수 개 이동 시간은 가운데 값을 대표 이동 시간으로 쓴다")
    void usesMiddleValueForOddSamples() {
        TravelTimeSamples samples = new TravelTimeSamples();
        samples.add(300);
        samples.add(60);
        samples.add(120);

        assertThat(samples.median()).isEqualTo(120);
    }

    @Test
    @DisplayName("짝수 개 이동 시간은 가운데 두 값의 평균을 반올림한다")
    void roundsAverageOfMiddleValuesForEvenSamples() {
        TravelTimeSamples samples = new TravelTimeSamples();
        for (int seconds : new int[]{30, 61, 90, 200, 10}) {
            samples.add(seconds);
        }
        samples.add(70);

        assertThat(samples.median()).isEqualTo(66);
    }
}
