package com.jachwisunbae.property.repository;

import com.jachwisunbae.property.entity.PropertyMemo;
import java.util.Optional;

public interface PropertyMemoRepository {
    Optional<PropertyMemo> findByPropertyId(long propertyId);

    PropertyMemo save(PropertyMemo memo);

    void update(PropertyMemo memo);

    void deleteByPropertyId(long propertyId);
}
