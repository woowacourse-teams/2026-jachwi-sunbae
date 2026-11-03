package com.jachwisunbae.notification.config;

import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

/** UI 노출과 실제 발송에 같은 단일 설치 허용 규칙을 적용한다. */
@Component
public class WeatherPushTestPolicy {
    private final boolean enabled;
    private final UUID installationId;

    public WeatherPushTestPolicy(final Environment environment,
            @Value("${weather.notification.test-enabled:false}") final boolean enabled,
            @Value("${weather.notification.test-installation-id:}") final String installationId) {
        this.installationId = installationId.isBlank() ? null : UUID.fromString(installationId);
        this.enabled = enabled && (!environment.acceptsProfiles(Profiles.of("prod")) || this.installationId != null);
    }

    public boolean enabled() { return enabled; }

    public UUID installationId() { return installationId; }

    public boolean allows(final UUID candidate) {
        return enabled && (installationId == null || installationId.equals(candidate));
    }
}
