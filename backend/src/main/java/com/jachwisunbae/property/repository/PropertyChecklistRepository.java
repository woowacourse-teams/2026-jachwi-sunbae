package com.jachwisunbae.property.repository;

import com.jachwisunbae.checklist.type.CheckStage;
import com.jachwisunbae.property.repository.query.PropertyChecklistApplicationQuery;
import java.util.Optional;

public interface PropertyChecklistRepository {

    void deleteByPropertyAndStage(long propertyId, CheckStage stage);

    long save(long propertyId, Long sourceChecklistId, String checklistName, CheckStage stage);

    Optional<PropertyChecklistApplicationQuery> findApplication(long memberId, long propertyId,
                                                                  long propertyChecklistId);

}
