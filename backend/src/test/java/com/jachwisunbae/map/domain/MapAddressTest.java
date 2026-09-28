package com.jachwisunbae.map.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class MapAddressTest {

    private static final BigDecimal LATITUDE = new BigDecimal("37.4064");
    private static final BigDecimal LONGITUDE = new BigDecimal("127.0888");

    @Test
    @DisplayName("지번 주소가 없어도 도로명주소와 좌표로 만들 수 있다")
    void createsWithoutJibunAddress() {
        MapAddress address = new MapAddress("경기도 성남시 수정구 금토로80번길 40", null, LATITUDE, LONGITUDE);

        assertThat(address.jibunAddress()).isNull();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = " ")
    @DisplayName("도로명주소가 없으면 만들 수 없다")
    void requiresRoadAddress(String roadAddress) {
        assertThatThrownBy(() -> new MapAddress(roadAddress, "경기도 성남시 수정구 금토동 715", LATITUDE, LONGITUDE))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("위도나 경도가 없으면 만들 수 없다")
    void requiresCoordinate() {
        assertThatThrownBy(() -> new MapAddress("경기도 성남시 수정구 금토로80번길 40", null, null, LONGITUDE))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new MapAddress("경기도 성남시 수정구 금토로80번길 40", null, LATITUDE, null))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
