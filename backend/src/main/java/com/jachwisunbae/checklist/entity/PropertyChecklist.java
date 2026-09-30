package com.jachwisunbae.checklist.entity;

import lombok.Getter;
import com.jachwisunbae.checklist.type.CheckStage;

@Getter
public class PropertyChecklist {

    private final Long id;
    private final Long propertyId;
    private final Long userChecklistId;
    private final String checklistName;
    private final CheckStage stage;

    private PropertyChecklist(final Long id, final Long propertyId, final Long userChecklistId,
                              final String checklistName, final CheckStage stage) {
        this.id = id;
        this.propertyId = propertyId;
        this.userChecklistId = userChecklistId;
        this.checklistName = checklistName;
        this.stage = stage;
    }

    public static PropertyChecklist create(final Long propertyId, final Long userChecklistId,
                                           final String checklistName, final CheckStage stage) {
        return new PropertyChecklist(null, validateId(propertyId), validateNullableId(userChecklistId),
                validateName(checklistName), validateStage(stage));
    }

    public static PropertyChecklist reconstruct(final Long id, final Long propertyId, final Long userChecklistId,
                                                final String checklistName, final CheckStage stage) {
        return new PropertyChecklist(id, validateId(propertyId), validateNullableId(userChecklistId),
                validateName(checklistName), validateStage(stage));
    }

    // 매물 체크리스트의 값은 서버가 매물과 적용한 체크리스트에서 복사해 넣는다. 어긋나면 서버 코드 문제다.
    private static Long validateId(final Long id) {
        return requireNonNull(id, "매물 체크리스트 ID는 필수입니다.");
    }

    private static Long validateNullableId(final Long id) {
        return id;
    }

    private static String validateName(final String name) {
        return requireTrimmed(name, 30, "적용 체크리스트 이름은 trim 후 1자 이상 30자 이하여야 합니다.");
    }

    private static CheckStage validateStage(final CheckStage stage) {
        return requireNonNull(stage, "적용 단계는 필수입니다.");
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
