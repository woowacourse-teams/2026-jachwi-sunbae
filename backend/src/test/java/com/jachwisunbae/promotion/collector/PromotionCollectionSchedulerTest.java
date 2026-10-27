package com.jachwisunbae.promotion.collector;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.jachwisunbae.promotion.service.PromotionCollectionService;
import com.jachwisunbae.weather.config.WeatherSchedulingConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.WebApplicationContextRunner;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.annotation.ScheduledAnnotationBeanPostProcessor;

@ExtendWith(OutputCaptureExtension.class)
class PromotionCollectionSchedulerTest {

    private final PromotionCollectionService service = mock(PromotionCollectionService.class);
    private final WebApplicationContextRunner runner = new WebApplicationContextRunner()
            .withUserConfiguration(WeatherSchedulingConfig.class, PromotionCollectionScheduler.class)
            .withBean(PromotionCollectionService.class, () -> service);

    @Test
    @DisplayName("설정이 없거나 false이면 스케줄러 Bean과 작업을 등록하지 않는다")
    void disabledByDefault() {
        runner.run(context -> {
            assertThat(context).doesNotHaveBean(PromotionCollectionScheduler.class);
            assertThat(context.getBean(ScheduledAnnotationBeanPostProcessor.class).getScheduledTasks()).isEmpty();
            verifyNoInteractions(service);
        });
        runner.withPropertyValues("promotion.collection.enabled=false").run(context -> {
            assertThat(context).doesNotHaveBean(PromotionCollectionScheduler.class);
            assertThat(context.getBean(ScheduledAnnotationBeanPostProcessor.class).getScheduledTasks()).isEmpty();
            verifyNoInteractions(service);
        });
    }

    @ParameterizedTest
    @ValueSource(strings = {"local", "dev", "prod"})
    @DisplayName("모든 기존 프로필에서 행사상품 자동 수집은 비활성화 상태다")
    void profilesKeepCollectionDisabled(final String profile) {
        runner.withInitializer(context -> {
            context.getEnvironment().getPropertySources().remove(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME);
            context.getEnvironment().setActiveProfiles(profile);
            new ConfigDataApplicationContextInitializer().initialize(context);
        }).run(context -> {
            assertThat(context).hasNotFailed().doesNotHaveBean(PromotionCollectionScheduler.class);
            assertThat(context.getEnvironment().getProperty("promotion.collection.enabled", Boolean.class)).isFalse();
            assertThat(context.getBean(ScheduledAnnotationBeanPostProcessor.class).getScheduledTasks()).isEmpty();
            verifyNoInteractions(service);
        });
    }

    @Test
    @DisplayName("활성화하면 기존 Scheduling 설정으로 작업을 등록하고 실제 작업 실행이 Service를 호출한다")
    void enabledTaskCallsServiceWithoutExternalHttp() {
        runner.withPropertyValues("promotion.collection.enabled=true").run(context -> {
            assertThat(context).hasSingleBean(PromotionCollectionScheduler.class);
            var tasks = context.getBean(ScheduledAnnotationBeanPostProcessor.class).getScheduledTasks();
            assertThat(tasks).hasSize(1);
            verifyNoInteractions(service);

            tasks.iterator().next().getTask().getRunnable().run();

            verify(service).collect();
        });
    }

    @Test
    @DisplayName("등록한 실행 시각은 한국시간 기준 매일 오전 4시다")
    void schedulesDailyAtFourInKst() throws Exception {
        Scheduled scheduled = PromotionCollectionScheduler.class.getMethod("collect").getAnnotation(Scheduled.class);
        assertThat(scheduled.cron()).isEqualTo("0 0 4 * * *");
        assertThat(scheduled.zone()).isEqualTo("Asia/Seoul");
    }

    @Test
    @DisplayName("수집 예외는 실패 유형을 기록하고 다음 스케줄 호출을 막지 않는다")
    void recordsFailureAndAllowsNextInvocation(final CapturedOutput output) {
        doThrow(new IllegalStateException("전체 HTML이나 외부 응답을 로그에 넣지 않는다")).doNothing().when(service).collect();
        PromotionCollectionScheduler scheduler = new PromotionCollectionScheduler(service);

        scheduler.collect();
        scheduler.collect();

        verify(service, times(2)).collect();
        assertThat(output).contains("promotion-scheduled-collection-failed exceptionType=IllegalStateException")
                .doesNotContain("전체 HTML이나 외부 응답을 로그에 넣지 않는다");
    }
}
