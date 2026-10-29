package com.jachwisunbae.transit.domain.vo;

public record Seconds(int value) {

    public Seconds {
        if (value < 0) {
            throw new IllegalArgumentException("시간은 0초 이상이어야 합니다. value=" + value);
        }
    }
}
