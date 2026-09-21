package com.jachwisunbae.member.entity;

import lombok.Getter;
import com.jachwisunbae.common.entity.BaseTimeEntity;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.common.validation.DomainPreconditions;

import java.time.LocalDateTime;

@Getter
public class Member extends BaseTimeEntity {

    private final Long id;
    private String nickname;
    private String passwordHash;

    private Member(final Long id, final String nickname, final String passwordHash,
                   final LocalDateTime createdAt, final LocalDateTime updatedAt) {
        super(createdAt, updatedAt);
        this.id = id;
        this.nickname = validateNickname(nickname);
        this.passwordHash = passwordHash;
    }

    public static Member create(final String nickname, final String passwordHash, final LocalDateTime now) {
        return new Member(null, nickname, passwordHash, now, now);
    }

    public static Member reconstruct(final Long id, final String nickname, final String passwordHash,
                                     final LocalDateTime createdAt, final LocalDateTime updatedAt) {
        return new Member(id, nickname, passwordHash, createdAt, updatedAt);
    }

    public boolean isPasswordProtected() {
        return passwordHash != null;
    }

    private static String validateNickname(final String nickname) {
        return DomainPreconditions.requireTrimmed(nickname, 1, 50, DomainErrorCode.NICKNAME_INVALID,
            "닉네임은 trim 후 1자 이상 50자 이하여야 합니다.");
    }
}
