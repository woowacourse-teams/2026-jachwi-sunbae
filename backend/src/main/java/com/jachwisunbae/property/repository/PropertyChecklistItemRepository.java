package com.jachwisunbae.property.repository;

import com.jachwisunbae.checklist.entity.PropertyChecklistItem;
import com.jachwisunbae.checklist.type.CheckStage;
import com.jachwisunbae.property.repository.query.PropertyChecklistItemStateQuery;
import java.util.List;
import java.util.Optional;

public interface PropertyChecklistItemRepository {

    List<PropertyChecklistItemStateQuery> findCurrentStates(long propertyId, CheckStage stage);

    void saveAll(long propertyChecklistId, List<PropertyChecklistItemStateQuery> items);

    void deleteByPropertyAndStage(long propertyId, CheckStage stage);

    Optional<PropertyChecklistItem> find(long memberId, long propertyId, long propertyChecklistId, long itemId);

    int updateStatus(PropertyChecklistItem item);

    int updateMemo(PropertyChecklistItem item);
}
