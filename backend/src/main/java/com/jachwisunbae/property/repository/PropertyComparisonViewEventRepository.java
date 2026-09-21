package com.jachwisunbae.property.repository;

import java.time.LocalDateTime;

public interface PropertyComparisonViewEventRepository {

    void save(long memberId, int propertyCount, LocalDateTime viewedAt);
}
