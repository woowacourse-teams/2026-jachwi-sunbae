package com.jachwisunbae.auth.controller.dto;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        boolean newMember,
        LoginMemberResponse member) {
}
