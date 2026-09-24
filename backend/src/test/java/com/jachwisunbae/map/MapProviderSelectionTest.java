package com.jachwisunbae.map;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class MapProviderSelectionTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(DemoAddressProvider.class, DemoNearbyPlaceProvider.class, NaverMapProvider.class);

    @Test
    void usesDemoProvidersWhenModeIsMissing() {
        contextRunner.run(context -> {
            assertThat(context).getBean(AddressProvider.class).isInstanceOf(DemoAddressProvider.class);
            assertThat(context).getBean(NearbyPlaceProvider.class).isInstanceOf(DemoNearbyPlaceProvider.class);
        });
    }

    @Test
    void usesNaverProviderWhenModeIsNaver() {
        contextRunner
                .withPropertyValues(
                        "map.provider.mode=naver",
                        "map.naver.client-id=map-id",
                        "map.naver.client-secret=map-secret",
                        "map.naver.search-client-id=search-id",
                        "map.naver.search-client-secret=search-secret")
                .run(context -> {
                    assertThat(context).getBean(AddressProvider.class).isInstanceOf(NaverMapProvider.class);
                    assertThat(context).getBean(NearbyPlaceProvider.class).isInstanceOf(NaverMapProvider.class);
                });
    }
}
