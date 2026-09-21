package com.jachwisunbae.common.observability;

import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class ApplicationLifecycleLogger {

    private static final Logger LOG = LoggerFactory.getLogger(ApplicationLifecycleLogger.class);

    @EventListener(ApplicationReadyEvent.class)
    public void logApplicationReady() {
        LOG.atInfo()
                .addKeyValue("event_type", "application_ready")
                .log("Application is ready");
    }

    @PreDestroy
    public void logApplicationStopping() {
        LOG.atInfo()
                .addKeyValue("event_type", "application_stopping")
                .log("Application is stopping");
    }
}
