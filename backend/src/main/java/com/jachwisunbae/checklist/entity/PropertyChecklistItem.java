package com.jachwisunbae.checklist.entity;

import lombok.Getter;
import com.jachwisunbae.checklist.type.CheckStatus;
import com.jachwisunbae.common.exception.client.InvalidInputException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;

@Getter
public class PropertyChecklistItem {

    private static final int MAX_MEMO_LENGTH = 500;
    private static final int MAX_QUESTION_LENGTH = 200;
    private final Long id;
    private final Long propertyChecklistId;
    private final Long systemCheckItemId;
    private Integer displayOrder;
    private CheckStatus status;
    private String memo;
    private final String question;

    private PropertyChecklistItem(final Long id, final Long propertyChecklistId, final Long systemCheckItemId,
                                  final Integer displayOrder, final CheckStatus status, final String memo,
                                  final String question) {
        this.id = id;
        this.propertyChecklistId = propertyChecklistId;
        this.systemCheckItemId = systemCheckItemId;
        this.displayOrder = displayOrder;
        this.status = status;
        this.memo = memo;
        this.question = question;
    }

    public static PropertyChecklistItem create(final Long propertyChecklistId, final Long systemCheckItemId,
                                              final Integer displayOrder, final String question) {
        return new PropertyChecklistItem(null, validateId(propertyChecklistId), validateId(systemCheckItemId),
                validateOrder(displayOrder), CheckStatus.UNCONFIRMED, "", validateQuestion(question));
    }

    public static PropertyChecklistItem reconstruct(final Long id, final Long propertyChecklistId,
                                                    final Long systemCheckItemId, final Integer displayOrder,
                                                    final CheckStatus status, final String memo,
                                                    final String question) {
        return new PropertyChecklistItem(id, validateId(propertyChecklistId), validateId(systemCheckItemId),
                validateOrder(displayOrder), validateStatus(status), validateMemo(memo), validateQuestion(question));
    }

    public void changeStatus(final CheckStatus status) {
        this.status = validateStatus(status);
    }

    public void changeMemo(final String memo) {
        this.memo = validateMemo(memo);
    }

    public void reorder(final Integer displayOrder) {
        this.displayOrder = validateOrder(displayOrder);
    }

    // ID, 표시 순서, 질문은 서버가 스냅샷으로 복사해 넣는 값이다. 어긋나면 서버 코드 문제다.
    private static Long validateId(final Long id) {
        if (id == null) {
            throw new IllegalArgumentException("매물 체크 항목 ID는 필수입니다.");
        }
        return id;
    }

    private static Integer validateOrder(final Integer order) {
        if (order == null || order <= 0) {
            throw new IllegalArgumentException("표시 순서는 양수여야 합니다: " + order);
        }
        return order;
    }

    // 체크 상태와 메모는 사용자가 매물 체크 항목에서 직접 바꾸는 값이다.
    private static CheckStatus validateStatus(final CheckStatus status) {
        if (status == null) {
            throw new InvalidInputException(ErrorCode.PROPERTY_CHECK_RESULT_INVALID, "체크 상태는 필수입니다.");
        }
        return status;
    }

    private static String validateMemo(final String memo) {
        String value = defaultMemo(memo);
        if (value.length() > MAX_MEMO_LENGTH) {
            throw new InvalidInputException(ErrorCode.PROPERTY_CHECK_RESULT_INVALID, "항목 메모는 500자 이하여야 합니다.");
        }
        return value;
    }

    private static String defaultMemo(final String memo) {
        if (memo == null) {
            return "";
        }
        return memo;
    }

    private static String validateQuestion(final String question) {
        if (question == null || question.isBlank() || question.trim().length() > MAX_QUESTION_LENGTH) {
            throw new IllegalArgumentException("스냅샷 질문은 trim 후 1자 이상 200자 이하여야 합니다.");
        }
        return question.trim();
    }
}
