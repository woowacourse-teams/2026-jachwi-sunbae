package com.jachwisunbae.admin.repository.query;

import java.time.Instant;

public record AdminMember(long memberId, Instant createdAt, long activeProperties, long activePhotos) {
}
