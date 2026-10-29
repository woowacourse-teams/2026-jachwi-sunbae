package com.jachwisunbae.transit.domain.collection;

import java.util.Arrays;

// 짝수 개면 가운데 두 값의 평균을 반올림한다.
public final class Median {

    private Median() {
    }

    public static int of(final int[] values) {
        if (values.length == 0) {
            throw new IllegalArgumentException("중앙값을 구할 값이 없습니다.");
        }
        int[] sorted = values.clone();
        Arrays.sort(sorted);
        int middle = sorted.length / 2;
        if (sorted.length % 2 == 1) {
            return sorted[middle];
        }
        return (int) Math.round((sorted[middle - 1] + sorted[middle]) / 2.0);
    }
}
