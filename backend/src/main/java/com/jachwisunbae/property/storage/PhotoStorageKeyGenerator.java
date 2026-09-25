package com.jachwisunbae.property.storage;

import com.jachwisunbae.property.entity.photo.PhotoFile;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class PhotoStorageKeyGenerator {

    private final PhotoStorageProperties properties;

    public PhotoStorageKeyGenerator(final PhotoStorageProperties properties) {
        this.properties = properties;
    }

    public String generate(final Long memberId, final Long propertyId, final PhotoFile photoFile) {
        return properties.keyPrefix() + "members/" + memberId + "/properties/" + propertyId + "/"
            + UUID.randomUUID() + photoFile.extension();
    }
}
