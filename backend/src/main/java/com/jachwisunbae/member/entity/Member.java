package com.jachwisunbae.member.entity;

import lombok.Getter;
import com.jachwisunbae.common.entity.BaseTimeEntity;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.common.validation.DomainPreconditions;

import java.time.LocalDateTime;

@Getter
public class Member extends BaseTimeEntity {

    private final Long id;
    private String email;
    private String name;
    private LocalDateTime lastLoginAt;
    private LocalDateTime firstPropertyCreatedAt;

    private Member(final Long id, final String email, final String name,
                   final LocalDateTime lastLoginAt,
                   final LocalDateTime firstPropertyCreatedAt,
                   final LocalDateTime createdAt,
                   final LocalDateTime updatedAt) {
        super(createdAt, updatedAt);
        this.id = id;
        this.email = email;
        this.name = name;
        this.lastLoginAt = lastLoginAt;
        this.firstPropertyCreatedAt = firstPropertyCreatedAt;
    }

    public static Member create(final String email, final String name, final LocalDateTime now) {
        return new Member(null, validateEmail(email), validateName(name), now, null, now, now);
    }

    public static Member reconstruct(final Long id, final String email, final String name,
                                     final LocalDateTime lastLoginAt,
                                     final LocalDateTime firstPropertyCreatedAt,
                                     final LocalDateTime createdAt,
                                     final LocalDateTime updatedAt) {
        return new Member(id, validateEmail(email), validateName(name), lastLoginAt, firstPropertyCreatedAt,
                createdAt, updatedAt);
    }

    public void recordNicknameLogin(final String name, final LocalDateTime loginAt) {
        this.name = validateName(name);
        this.lastLoginAt = DomainPreconditions.requireNonNull(loginAt, DomainErrorCode.MEMBER_NAME_INVALID,
                "최근 로그인 시각은 필수입니다.");
        updateUpdatedAt(loginAt);
    }

    public boolean recordFirstProperty(final LocalDateTime createdAt) {
        if (firstPropertyCreatedAt != null) {
            return false;
        }
        this.firstPropertyCreatedAt = DomainPreconditions.requireNonNull(createdAt,
                DomainErrorCode.MEMBER_FIRST_PROPERTY_CREATED_AT_REQUIRED, "첫 매물 등록 시각은 필수입니다.");
        updateUpdatedAt(createdAt);
        return true;
    }

    private static String validateEmail(final String email) {
        return DomainPreconditions.requireNonBlank(email, DomainErrorCode.MEMBER_EMAIL_INVALID,
                "이메일은 필수입니다.");
    }

    private static String validateName(final String name) {
        return DomainPreconditions.requireTrimmed(name, 1, 100, DomainErrorCode.MEMBER_NAME_INVALID,
                "회원 이름은 trim 후 1자 이상 100자 이하여야 합니다.");
    }

}
