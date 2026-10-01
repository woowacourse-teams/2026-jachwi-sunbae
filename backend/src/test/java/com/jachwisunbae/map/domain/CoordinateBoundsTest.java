package com.jachwisunbae.map.domain;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CoordinateBoundsTest {

    private static final BigDecimal LATITUDE = new BigDecimal("37.3948");
    private static final BigDecimal LONGITUDE = new BigDecimal("127.1112");

    @Test
    @DisplayName("최솟값과 최댓값이 같은 한 점도 범위로 만들 수 있다")
    void allowsSinglePoint() {
        assertThatCode(() -> CoordinateBounds.of(LATITUDE, LATITUDE, LONGITUDE, LONGITUDE))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("최솟값이 최댓값보다 크면 만들 수 없다")
    void rejectsReversedRange() {
        BigDecimal larger = new BigDecimal("37.4");

        assertThatThrownBy(() -> CoordinateBounds.of(larger, LATITUDE, LONGITUDE, LONGITUDE))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> CoordinateBounds.of(LATITUDE, LATITUDE, new BigDecimal("127.2"), LONGITUDE))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("범위 값이 없으면 만들 수 없다")
    void requiresAllValues() {
        assertThatThrownBy(() -> CoordinateBounds.of(null, LATITUDE, LONGITUDE, LONGITUDE))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> CoordinateBounds.of(LATITUDE, LATITUDE, LONGITUDE, null))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
