package com.jachwisunbae.common.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class LocalDatabaseSampleConfigTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(LocalDatabaseSampleConfig.class);

    @Test
    @DisplayName("local 프로필에서만 샘플 데이터 적재를 등록한다")
    void registersSampleLoadingOnlyForLocalProfile() {
        contextRunner.withInitializer(context -> context.getEnvironment().setActiveProfiles("local"))
                .run(context -> assertThat(context).hasSingleBean(FlywayMigrationStrategy.class));
    }

    @ParameterizedTest
    @DisplayName("local이 아닌 프로필에서는 샘플 데이터를 적재하지 않는다")
    @ValueSource(strings = {"prod", "test", "perf"})
    void doesNotLoadLocalSamplesForOtherProfiles(String profile) {
        contextRunner.withInitializer(context -> context.getEnvironment().setActiveProfiles(profile))
                .run(context -> assertThat(context).doesNotHaveBean(FlywayMigrationStrategy.class));
    }
}
