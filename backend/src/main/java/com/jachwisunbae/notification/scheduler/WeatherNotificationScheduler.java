package com.jachwisunbae.notification.scheduler;

import com.jachwisunbae.notification.domain.NotificationSlot;
import com.jachwisunbae.notification.service.WeatherNotificationDispatchService;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("${weather.notification.enabled:false} && ${weather.notification.schedule-enabled:false}")
public class WeatherNotificationScheduler {
    private final WeatherNotificationDispatchService service;
    private final UUID testInstallationId;

    public WeatherNotificationScheduler(final WeatherNotificationDispatchService service,
            @Value("${weather.notification.test-installation-id:}") final String testInstallationId) {
        this.service = service;
        this.testInstallationId = testInstallationId.isBlank() ? null : UUID.fromString(testInstallationId);
    }

    @Scheduled(cron = "0 0 7 * * *", zone = "Asia/Seoul")
    public void morning() {
        service.dispatch(NotificationSlot.MORNING, testInstallationId);
    }

    @Scheduled(cron = "0 0 22 * * *", zone = "Asia/Seoul")
    public void evening() {
        service.dispatch(NotificationSlot.EVENING, testInstallationId);
    }
}
