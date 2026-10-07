package com.jachwisunbae.transit.domain;

import java.util.Arrays;

// 같은 구간을 지나는 운행마다 이동 시간이 달라 중앙값을 대표 이동 시간으로 쓴다.
public class TravelTimeSamples {

    private int[] values = new int[4];
    private int size;

    public void add(final int seconds) {
        if (size == values.length) {
            values = Arrays.copyOf(values, values.length * 2);
        }
        values[size++] = seconds;
    }

    public int median() {
        Arrays.sort(values, 0, size);
        int middle = size / 2;
        if (size % 2 == 1) {
            return values[middle];
        }
        return (int) Math.round((values[middle - 1] + values[middle]) / 2.0);
    }
}
