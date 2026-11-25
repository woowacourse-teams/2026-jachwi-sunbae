package com.jachwisunbae.property.service;

import com.jachwisunbae.checklist.entity.PropertyChecklistItem;
import com.jachwisunbae.checklist.type.CheckStatus;
import com.jachwisunbae.common.exception.client.ResourceNotFoundException;
import com.jachwisunbae.common.exception.client.BusinessRuleViolationException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;
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
                                              final CheckStatus status, final long expectedVersion) {
        PropertyChecklistItem item = findItem(memberId, propertyId, propertyChecklistId, itemId);
        if (item.getStatus() == status) {
            return item;
        }
        validateVersion(expectedVersion, item.getStatusVersion());
        item.changeStatus(status);
        validateUpdated(propertyChecklistItemRepository.updateStatus(item));
        return item;
    }

    @Transactional
    public PropertyChecklistItem updateMemo(final Long memberId, final Long propertyId,
                                            final Long propertyChecklistId, final Long itemId,
                                            final String memo, final long expectedVersion) {
        PropertyChecklistItem item = findItem(memberId, propertyId, propertyChecklistId, itemId);
        if (item.getMemo().equals(memo)) {
            return item;
        }
        validateVersion(expectedVersion, item.getMemoVersion());
        item.changeMemo(memo);
        validateUpdated(propertyChecklistItemRepository.updateMemo(item));
        return item;
    }

    private PropertyChecklistItem findItem(final Long memberId, final Long propertyId,
                                           final Long propertyChecklistId, final Long itemId) {
        return propertyChecklistItemRepository.find(memberId, propertyId, propertyChecklistId, itemId)
            .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PROPERTY_CHECKLIST_ITEM_NOT_FOUND,
                "매물 체크 항목을 찾을 수 없습니다."));
    }

    private void validateVersion(final long expected, final long current) {
        if (expected < 0 || expected != current) {
            throw new BusinessRuleViolationException(ErrorCode.PROPERTY_CHECKLIST_ITEM_CONFLICT,
                    "체크 항목이 변경됐습니다. 최신 값을 확인하고 다시 선택해 주세요.");
        }
    }

    private void validateUpdated(final int updatedCount) {
        if (updatedCount == 0) {
            throw new ResourceNotFoundException(ErrorCode.PROPERTY_CHECKLIST_ITEM_NOT_FOUND,
                "매물 체크 항목을 찾을 수 없습니다.");
        }
    }
}
