package com.jachwisunbae.admin.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.task.TaskSchedulingAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

class AdminLogsConfigTest {

    @Test
    @DisplayName("관리자 타임아웃 스케줄러는 일반 서비스 예약 작업의 실행기를 대체하지 않는다")
    void keepsApplicationSchedulerSeparate() {
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(TaskSchedulingAutoConfiguration.class))
                .withUserConfiguration(AdminLogsConfig.class, SchedulingConfig.class)
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context.getBean("taskScheduler", TaskScheduler.class))
                            .isNotSameAs(context.getBean("adminLogsScheduler"));
                    var probe = context.getBean(ScheduledProbe.class);
                    assertThat(probe.completed.await(5, TimeUnit.SECONDS)).isTrue();
                    assertThat(probe.threadName).doesNotStartWith("admin-logs-");
                });
    }

    @Configuration(proxyBeanMethods = false)
    @EnableScheduling
    static class SchedulingConfig {
        @Bean
        ScheduledProbe scheduledProbe() {
            return new ScheduledProbe();
        }
    }

    static class ScheduledProbe {
        private final CountDownLatch completed = new CountDownLatch(1);
        private volatile String threadName;

        @Scheduled(initialDelay = 1)
        public void run() {
            threadName = Thread.currentThread().getName();
            completed.countDown();
        }
    }
}
