package com.jachwisunbae.property.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "photo.storage")
public record PhotoStorageProperties(
        String region,
        String endpoint,
        String accessKey,
        String secretKey,
        String bucket,
        String keyPrefix) {

    public PhotoStorageProperties {
        endpoint = emptyIfNull(endpoint);
        accessKey = emptyIfNull(accessKey);
        secretKey = emptyIfNull(secretKey);
        keyPrefix = normalizePrefix(keyPrefix);
    }

    private static String emptyIfNull(final String value) {
        return value == null ? "" : value;
    }

    private static String normalizePrefix(final String prefix) {
        if (prefix == null || prefix.isBlank()) {
            return "";
        }
        return prefix.endsWith("/") ? prefix : prefix + "/";
    }
}
