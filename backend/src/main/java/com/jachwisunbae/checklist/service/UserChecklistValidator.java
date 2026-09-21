package com.jachwisunbae.checklist.service;

import com.jachwisunbae.checklist.controller.dto.request.UserChecklistItemRequest;
import com.jachwisunbae.checklist.entity.SystemCheckItem;
import com.jachwisunbae.checklist.entity.UserChecklistItem;
import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class UserChecklistValidator {

    public void validateRequestedItems(final List<UserChecklistItemRequest> items) {
        if (items == null) {
            throw new BusinessException(DomainErrorCode.CHECKLIST_ITEMS_INVALID,
                "체크리스트 항목 목록은 null일 수 없습니다.");
        }
        Set<Long> systemIds = new HashSet<>();
        for (UserChecklistItemRequest item : items) {
            if (item == null || item.systemCheckItemId() == null || item.systemCheckItemId() <= 0) {
                throw new BusinessException(DomainErrorCode.CHECKLIST_ITEMS_INVALID,
                    "자취선배가 제공하는 올바른 체크 항목 ID가 필요합니다.");
            }
            if (!systemIds.add(item.systemCheckItemId())) {
                throw new BusinessException(DomainErrorCode.DUPLICATE_CHECK_ITEM,
                    "같은 체크 항목을 중복해서 추가할 수 없습니다.");
            }
        }
    }

    public void validateFinalItemCount(final int count) {
        if (count < 1 || count > 30) {
            throw new BusinessException(DomainErrorCode.CHECKLIST_ITEM_COUNT_OUT_OF_RANGE,
                "체크리스트 항목은 1개 이상 30개 이하여야 합니다.");
        }
    }

    public void validateItemsExist(final List<Long> requestedIds, final List<SystemCheckItem> items) {
        if (requestedIds.size() != items.size()) {
            throw new BusinessException(DomainErrorCode.INVALID_SYSTEM_CHECK_ITEM,
                "존재하지 않거나 단계가 일치하지 않는 시스템 체크 항목이 포함되어 있습니다.");
        }
    }

    public void validateUniqueQuestions(final List<UserChecklistItem> items) {
        Set<String> questions = new HashSet<>();
        if (items.stream().anyMatch(item -> !questions.add(item.getQuestion()))) {
            throw new BusinessException(DomainErrorCode.DUPLICATE_CHECK_ITEM,
                "같은 체크 항목을 중복해서 추가할 수 없습니다.");
        }
    }
}
