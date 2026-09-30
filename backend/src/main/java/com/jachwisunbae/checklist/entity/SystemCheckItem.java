package com.jachwisunbae.checklist.entity;

import lombok.Getter;
import com.jachwisunbae.checklist.type.CheckItemType;
import com.jachwisunbae.checklist.type.CheckStage;

import java.time.LocalDateTime;

@Getter
public class SystemCheckItem {

    private final Long id;
    private final CheckStage stage;
    private final CheckItemType itemType;
    private final String question;
    private final LocalDateTime deletedAt;

    private SystemCheckItem(final Long id, final CheckStage stage, final CheckItemType itemType,
                            final String question, final LocalDateTime deletedAt) {
        this.id = id;
        this.stage = stage;
        this.itemType = itemType;
        this.question = question;
        this.deletedAt = deletedAt;
    }

    public static SystemCheckItem reconstruct(final Long id, final CheckStage stage,
                                              final CheckItemType itemType, final String question,
                                              final LocalDateTime deletedAt) {
        // 시스템 체크 항목은 서버가 제공하는 시드 데이터다. 값이 어긋나면 서버 데이터 문제다.
        return new SystemCheckItem(id,
                requireNonNull(stage, "체크 단계는 필수입니다."),
                requireNonNull(itemType, "시스템 항목 유형은 필수입니다."),
                requireTrimmed(question, 200, "질문은 trim 후 1자 이상 200자 이하여야 합니다."), deletedAt);
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
