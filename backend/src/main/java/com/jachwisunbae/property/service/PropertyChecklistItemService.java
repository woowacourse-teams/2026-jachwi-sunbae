package com.jachwisunbae.property.service;

import com.jachwisunbae.checklist.entity.PropertyChecklistItem;
import com.jachwisunbae.checklist.type.CheckStatus;
import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.property.repository.PropertyChecklistItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PropertyChecklistItemService {

    private final PropertyChecklistItemRepository propertyChecklistItemRepository;

    public PropertyChecklistItemService(final PropertyChecklistItemRepository propertyChecklistItemRepository) {
        this.propertyChecklistItemRepository = propertyChecklistItemRepository;
    }

    @Transactional
    public PropertyChecklistItem updateStatus(final Long memberId, final Long propertyId,
                                              final Long propertyChecklistId, final Long itemId,
                                              final CheckStatus status) {
        PropertyChecklistItem item = findItem(memberId, propertyId, propertyChecklistId, itemId);
        item.changeStatus(status);
        validateUpdated(propertyChecklistItemRepository.updateStatus(item));
        return item;
    }

    @Transactional
    public PropertyChecklistItem updateMemo(final Long memberId, final Long propertyId,
                                            final Long propertyChecklistId, final Long itemId,
                                            final String memo) {
        PropertyChecklistItem item = findItem(memberId, propertyId, propertyChecklistId, itemId);
        item.changeMemo(memo);
        validateUpdated(propertyChecklistItemRepository.updateMemo(item));
        return item;
    }

    private PropertyChecklistItem findItem(final Long memberId, final Long propertyId,
                                           final Long propertyChecklistId, final Long itemId) {
        return propertyChecklistItemRepository.find(memberId, propertyId, propertyChecklistId, itemId)
            .orElseThrow(() -> new BusinessException(DomainErrorCode.PROPERTY_CHECKLIST_ITEM_NOT_FOUND,
                "매물 체크 항목을 찾을 수 없습니다."));
    }

    private void validateUpdated(final int updatedCount) {
        if (updatedCount == 0) {
            throw new BusinessException(DomainErrorCode.PROPERTY_CHECKLIST_ITEM_NOT_FOUND,
                "매물 체크 항목을 찾을 수 없습니다.");
        }
    }
}
