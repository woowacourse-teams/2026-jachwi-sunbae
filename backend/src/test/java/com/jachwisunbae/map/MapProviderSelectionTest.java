package com.jachwisunbae.map;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class MapProviderSelectionTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withBean(Clock.class, Clock::systemUTC)
            .withUserConfiguration(DemoAddressProvider.class, DemoNearbyPlaceProvider.class,
                    NaverMapProvider.class, JusoAddressClient.class, SgisAddressClient.class,
                    PublicDataAddressProvider.class, KakaoPlaceClient.class, KakaoNearbyPlaceProvider.class);

    @Test
    @DisplayName("설정이 없으면 주소와 주변 시설 모두 demo 공급자를 사용한다")
    void usesDemoProvidersWhenModeIsMissing() {
        contextRunner.run(context -> {
            assertThat(context).getBean(AddressProvider.class).isInstanceOf(DemoAddressProvider.class);
            assertThat(context).getBean(NearbyPlaceProvider.class).isInstanceOf(DemoNearbyPlaceProvider.class);
        });
    }

    @Test
    @DisplayName("주소 공급자와 주변 시설 공급자를 각각 선택한다")
    void selectsAddressAndNearbyProvidersIndependently() {
        contextRunner
                .withPropertyValues(
                        "map.provider.mode=naver",
                        "map.naver.client-id=map-id",
                        "map.naver.client-secret=map-secret",
                        "map.nearby.provider=kakao",
                        "map.kakao.rest-api-key=kakao-key")
                .run(context -> {
                    assertThat(context).getBean(AddressProvider.class).isInstanceOf(NaverMapProvider.class);
                    assertThat(context).getBean(NearbyPlaceProvider.class).isInstanceOf(KakaoNearbyPlaceProvider.class);
                });
    }

    @Test
    @DisplayName("주소 공급자만 naver로 바꾸면 주변 시설은 demo 공급자를 사용한다")
    void keepsDemoNearbyProviderWhenOnlyAddressProviderIsNaver() {
        contextRunner
                .withPropertyValues(
                        "map.provider.mode=naver",
                        "map.naver.client-id=map-id",
                        "map.naver.client-secret=map-secret")
                .run(context -> {
                    assertThat(context).getBean(AddressProvider.class).isInstanceOf(NaverMapProvider.class);
                    assertThat(context).getBean(NearbyPlaceProvider.class).isInstanceOf(DemoNearbyPlaceProvider.class);
                });
    }

    @Test
    @DisplayName("public 모드면 공공데이터 주소 공급자를 사용한다")
    void usesPublicDataAddressProviderWhenModeIsPublic() {
        contextRunner
                .withPropertyValues(
                        "map.provider.mode=public",
                        "map.juso.confirm-key=juso-key",
                        "map.sgis.consumer-key=sgis-key",
                        "map.sgis.consumer-secret=sgis-secret")
                .run(context -> assertThat(context).getBean(AddressProvider.class)
                        .isInstanceOf(PublicDataAddressProvider.class));
    }

    @Test
    @DisplayName("public 모드에 공공데이터 키가 없으면 애플리케이션이 시작되지 않는다")
    void failsToStartWithoutPublicDataKeys() {
        contextRunner
                .withPropertyValues("map.provider.mode=public", "map.juso.confirm-key=",
                        "map.sgis.consumer-key=", "map.sgis.consumer-secret=")
                .run(context -> assertThat(context).hasFailed());
    }

    @Test
    @DisplayName("kakao 주변 시설 모드에 키가 없으면 애플리케이션이 시작되지 않는다")
    void failsToStartWithoutKakaoKey() {
        contextRunner
                .withPropertyValues("map.nearby.provider=kakao", "map.kakao.rest-api-key=")
                .run(context -> assertThat(context).hasFailed());
    }
}
