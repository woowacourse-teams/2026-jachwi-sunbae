package com.jachwisunbae.auth.controller.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public record LoginMemberResponse(
        @Schema(description = "회원 ID")
        Long memberId,

        @Schema(description = "닉네임(표시 이름)", example = "이자취")
        String name,

        @Schema(description = "비밀번호로 보호된 닉네임인지 여부")
        boolean passwordProtected) {
}
