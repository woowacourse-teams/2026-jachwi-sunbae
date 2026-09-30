package com.jachwisunbae.auth.service.dto.result;

public record LoginResult(
        String accessToken,
        long expiresIn,
        boolean newMember,
        Long memberId,
        String nickname,
        boolean passwordProtected) {
}
