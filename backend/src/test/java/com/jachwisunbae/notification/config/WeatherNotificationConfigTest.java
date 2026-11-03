package com.jachwisunbae.notification.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mockStatic;

import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.jachwisunbae.notification.provider.WeatherPushSender;
import java.time.Clock;
import java.util.Date;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.core.env.StandardEnvironment;

class WeatherNotificationConfigTest {
    @Test
    @DisplayName("알림을 끄면 Firebase 인증 정보 없이 보내지 않는 발송기를 쓴다")
    void offNeedsNoFirebaseCredentials() {
        new ApplicationContextRunner().withUserConfiguration(DisabledWeatherPushConfig.class, FirebaseWeatherPushConfig.class)
                .run(context -> {
                    assertThat(context).hasNotFailed().hasSingleBean(WeatherPushSender.class).doesNotHaveBean(FirebaseApp.class);
                    assertThat(context.getBean(WeatherPushSender.class).send(null)).isFalse();
                });
    }

    @Test
    @DisplayName("알림을 켜면 인증 정보를 읽기 전에 Firebase project ID를 요구한다")
    void onRequiresProjectIdBeforeLoadingCredentials() {
        new ApplicationContextRunner().withUserConfiguration(FirebaseWeatherPushConfig.class)
                .withPropertyValues("weather.notification.enabled=true").withBean(Clock.class, Clock::systemUTC)
                .run(context -> assertThat(context.getStartupFailure()).hasRootCauseMessage("날씨 알림 활성화에는 Firebase project ID가 필요합니다."));
    }

    @ParameterizedTest
    @DisplayName("현재 프로필은 Firebase 인증 정보를 읽지 않고 시작한다")
    @ValueSource(strings = {"local", "prod"})
    void currentProfilesStartWithoutReadingFirebaseCredentials(final String name) {
        try (var credentials = mockStatic(GoogleCredentials.class)) {
            profile(name).run(context -> {
                assertThat(context).hasNotFailed().hasSingleBean(WeatherPushSender.class).doesNotHaveBean(FirebaseApp.class);
                credentials.verifyNoInteractions();
            });
        }
    }

    @ParameterizedTest
    @DisplayName("project ID가 비어 있으면 알림을 켜도 시작하지 않는다")
    @ValueSource(strings = {"dev", "prod"})
    void missingProjectIdPreventsAccidentalActivation(final String name) {
        try (var credentials = mockStatic(GoogleCredentials.class)) {
            profile(name).withPropertyValues("weather.notification.enabled=true",
                    "weather.notification.firebase-project-id=").run(context -> {
                assertThat(context.getStartupFailure()).hasRootCauseMessage("날씨 알림 활성화에는 Firebase project ID가 필요합니다.");
                credentials.verifyNoInteractions();
            });
        }
    }

    @ParameterizedTest
    @DisplayName("설정한 project ID와 기본 인증 정보로 Firebase를 만들고 푸시는 보내지 않는다")
    @ValueSource(strings = {"dev", "prod"})
    void configuredProjectIdIsUsedWithAdcWithoutSendingPush(final String name) {
        // 설정 주입 검증용 ID·토큰이며 실제 환경의 ID나 자격증명이 아니다.
        String projectId = "test-weather-" + name;
        GoogleCredentials testCredentials = GoogleCredentials.create(new AccessToken("test-only-token", new Date(Long.MAX_VALUE)));
        try (var credentials = mockStatic(GoogleCredentials.class)) {
            credentials.when(GoogleCredentials::getApplicationDefault).thenReturn(testCredentials);
            profile(name).withPropertyValues("weather.notification.enabled=true",
                    "weather.notification.firebase-project-id=" + projectId).run(context -> {
                assertThat(context).hasNotFailed().hasSingleBean(FirebaseApp.class).hasSingleBean(WeatherPushSender.class);
                assertThat(context.getBean(FirebaseApp.class).getOptions().getProjectId()).isEqualTo(projectId);
                credentials.verify(GoogleCredentials::getApplicationDefault);
            });
        }
    }

    private ApplicationContextRunner profile(final String name) {
        return new ApplicationContextRunner()
                .withUserConfiguration(DisabledWeatherPushConfig.class, FirebaseWeatherPushConfig.class)
                .withBean(Clock.class, Clock::systemUTC)
                .withInitializer(context -> {
                    context.getEnvironment().getPropertySources().remove(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME);
                    context.getEnvironment().setActiveProfiles(name);
                    new ConfigDataApplicationContextInitializer().initialize(context);
                });
    }
}
