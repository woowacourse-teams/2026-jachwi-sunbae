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

    public void validateCreateItems(final List<UserChecklistItemRequest> items) {
        validateItems(items, Set.of());
    }

    public void validateUpdateItems(final List<UserChecklistItemRequest> items,
                                    final List<UserChecklistItem> existingItems) {
        Set<String> legacyCustomQuestions = existingItems.stream()
                .filter(UserChecklistItem::isCustom)
                .map(UserChecklistItem::getQuestion)
                .collect(java.util.stream.Collectors.toUnmodifiableSet());
        validateItems(items, legacyCustomQuestions);
    }

    private void validateItems(final List<UserChecklistItemRequest> items,
                               final Set<String> legacyCustomQuestions) {
        if (items == null) {
            throw new BusinessException(DomainErrorCode.CHECKLIST_ITEMS_INVALID,
                    "체크리스트 항목 목록은 null일 수 없습니다.");
        }
        if (items.isEmpty() || items.size() > 30) {
            throw new BusinessException(DomainErrorCode.CHECKLIST_ITEM_COUNT_OUT_OF_RANGE,
                    "체크리스트 항목은 1개 이상 30개 이하여야 합니다.");
        }
        Set<Long> systemIds = new HashSet<>();
        Set<String> customQuestions = new HashSet<>();
        for (UserChecklistItemRequest item : items) {
            if (item == null) {
                throw invalidItem();
            }
            boolean hasSystemId = item.systemCheckItemId() != null;
            boolean hasQuestion = item.question() != null;
            if (hasSystemId == hasQuestion || hasSystemId && item.systemCheckItemId() <= 0) {
                throw invalidItem();
            }
            if (hasSystemId && !systemIds.add(item.systemCheckItemId())) {
                throw duplicateItem();
            }
            if (hasQuestion) {
                String question = item.question().trim();
                if (question.isEmpty() || question.codePointCount(0, question.length()) > 200) {
                    throw invalidItem();
                }
                if (!legacyCustomQuestions.contains(question)) {
                    throw new BusinessException(DomainErrorCode.CHECKLIST_ITEMS_INVALID,
                            "사용자 직접 질문은 새로 추가하거나 수정할 수 없습니다.");
                }
                if (!customQuestions.add(question)) {
                    throw duplicateItem();
                }
            }
        }
    }

    public void validateItemsExist(final List<Long> requestedIds, final List<SystemCheckItem> items) {
        if (requestedIds.size() != items.size()) {
            throw new BusinessException(DomainErrorCode.INVALID_SYSTEM_CHECK_ITEM,
                    "존재하지 않는 시스템 체크 항목이 포함되어 있습니다.");
        }
    }

    public void validateUniqueQuestions(final List<UserChecklistItem> items) {
        Set<String> questions = new HashSet<>();
        if (items.stream().anyMatch(item -> !questions.add(item.getQuestion()))) {
            throw duplicateItem();
        }
    }

    private BusinessException invalidItem() {
        return new BusinessException(DomainErrorCode.CHECKLIST_ITEMS_INVALID,
                "자취선배가 제공하는 체크 항목 ID가 필요합니다.");
    }

    private BusinessException duplicateItem() {
        return new BusinessException(DomainErrorCode.DUPLICATE_CHECK_ITEM,
                "같은 체크 항목을 중복해서 추가할 수 없습니다.");
    }
}
