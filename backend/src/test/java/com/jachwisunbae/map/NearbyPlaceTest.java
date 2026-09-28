package com.jachwisunbae.map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class NearbyPlaceTest {

    private static final BigDecimal LATITUDE = new BigDecimal("37.4064");
    private static final BigDecimal LONGITUDE = new BigDecimal("127.0888");

    @Test
    @DisplayName("주소가 없으면 빈 문자열로 정규화한다")
    void normalizesMissingAddress() {
        NearbyPlace place = new NearbyPlace("kakao:1", "판교병원", MapCategory.HOSPITAL, null,
                LATITUDE, LONGITUDE, 100);

        assertThat(place.address()).isEmpty();
    }

    @Test
    @DisplayName("ID가 비어 있으면 만들 수 없다")
    void requiresProviderPlaceId() {
        assertThatThrownBy(() -> new NearbyPlace(" ", "판교병원", MapCategory.HOSPITAL, "주소",
                LATITUDE, LONGITUDE, 100))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("이름이 비어 있으면 만들 수 없다")
    void requiresName() {
        assertThatThrownBy(() -> new NearbyPlace("kakao:1", "", MapCategory.HOSPITAL, "주소",
                LATITUDE, LONGITUDE, 100))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("카테고리가 없으면 만들 수 없다")
    void requiresCategory() {
        assertThatThrownBy(() -> new NearbyPlace("kakao:1", "판교병원", null, "주소",
                LATITUDE, LONGITUDE, 100))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("좌표가 없거나 범위를 벗어나면 만들 수 없다")
    void requiresValidCoordinates() {
        assertThatThrownBy(() -> new NearbyPlace("kakao:1", "판교병원", MapCategory.HOSPITAL, "주소",
                null, LONGITUDE, 100))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new NearbyPlace("kakao:1", "판교병원", MapCategory.HOSPITAL, "주소",
                new BigDecimal("91"), LONGITUDE, 100))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new NearbyPlace("kakao:1", "판교병원", MapCategory.HOSPITAL, "주소",
                LATITUDE, new BigDecimal("-181"), 100))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("거리가 음수이면 만들 수 없다")
    void requiresNonNegativeDistance() {
        assertThatThrownBy(() -> new NearbyPlace("kakao:1", "판교병원", MapCategory.HOSPITAL, "주소",
                LATITUDE, LONGITUDE, -1))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
