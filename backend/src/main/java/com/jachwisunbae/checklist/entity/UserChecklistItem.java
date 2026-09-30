package com.jachwisunbae.checklist.entity;

import lombok.Getter;
import com.jachwisunbae.checklist.type.CheckStage;
import com.jachwisunbae.checklist.type.CheckItemType;

@Getter
public class UserChecklistItem {

    private final Long id;
    private final Long userChecklistId;
    private final Long systemCheckItemId;
    private final CheckStage stage;
    private final CheckItemType itemType;
    private final String question;
    private final Integer displayOrder;

    private UserChecklistItem(final Long id, final Long userChecklistId, final Long systemCheckItemId,
                              final CheckStage stage, final CheckItemType itemType, final String question,
                              final Integer displayOrder) {
        this.id = id;
        this.userChecklistId = userChecklistId;
        this.systemCheckItemId = systemCheckItemId;
        this.stage = stage;
        this.itemType = itemType;
        this.question = question;
        this.displayOrder = displayOrder;
    }

    public static UserChecklistItem create(final Long userChecklistId, final SystemCheckItem systemItem,
                                           final Integer displayOrder) {
        return new UserChecklistItem(
            null,
            validateId(userChecklistId),
            validateId(systemItem.getId()),
            systemItem.getStage(),
            systemItem.getItemType(),
            systemItem.getQuestion(),
            validateOrder(displayOrder)
        );
    }

    public static UserChecklistItem reconstruct(final Long id, final Long userChecklistId,
                                                final Long systemCheckItemId, final CheckStage stage,
                                                final CheckItemType itemType, final String question,
                                                final Integer displayOrder) {
        return new UserChecklistItem(
            id,
            validateId(userChecklistId),
            systemCheckItemId,
            requireNonNull(stage, "체크리스트 단계는 필수입니다."),
            requireNonNull(itemType, "체크리스트 항목 유형은 필수입니다."),
            validateQuestion(question),
            validateOrder(displayOrder)
        );
    }

    // 체크리스트 항목의 값은 모두 서버가 시스템 체크 항목에서 복사하거나 계산해 넣는다. 어긋나면 서버 코드 문제다.
    private static Long validateId(final Long id) {
        return requireNonNull(id, "체크리스트 항목 ID는 필수입니다.");
    }

    private static Integer validateOrder(final Integer order) {
        if (order == null || order <= 0) {
            throw new IllegalArgumentException("표시 순서는 양수여야 합니다: " + order);
        }
        return order;
    }

    private static String validateQuestion(final String question) {
        return requireTrimmed(question, 200, "체크리스트 질문은 trim 후 1자 이상 200자 이하여야 합니다.");
    }

    private static <T> T requireNonNull(final T value, final String message) {
        if (value == null) {
            throw new IllegalArgumentException(message);
        }
        return value;
    }

    private static String requireTrimmed(final String value, final int maxLength, final String message) {
        if (value == null || value.isBlank() || value.trim().length() > maxLength) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }
}
