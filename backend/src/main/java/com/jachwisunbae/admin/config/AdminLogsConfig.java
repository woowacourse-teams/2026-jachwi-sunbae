package com.jachwisunbae.admin.config;

import java.time.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import software.amazon.awssdk.core.client.config.ClientOverrideConfiguration;
import software.amazon.awssdk.core.retry.RetryPolicy;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudwatchlogs.CloudWatchLogsClient;

@Configuration
public class AdminLogsConfig {

    @Bean
    public CloudWatchLogsClient cloudWatchLogsClient() {
        return CloudWatchLogsClient.builder()
                .region(Region.AP_NORTHEAST_2)
                .overrideConfiguration(ClientOverrideConfiguration.builder()
                        .apiCallTimeout(Duration.ofSeconds(5))
                        .apiCallAttemptTimeout(Duration.ofSeconds(3))
                        // 시작 응답이 유실되어도 같은 쿼리를 중복 실행하지 않는다.
                        .retryPolicy(RetryPolicy.none())
                        .build())
                .build();
    }

    // 기존 @Scheduled 작업의 기본 스케줄러 자동 구성을 대체하지 않는다.
    @Bean(defaultCandidate = false)
    public ThreadPoolTaskScheduler adminLogsScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(2);
        scheduler.setThreadNamePrefix("admin-logs-");
        scheduler.setRemoveOnCancelPolicy(true);
        return scheduler;
    }
}
