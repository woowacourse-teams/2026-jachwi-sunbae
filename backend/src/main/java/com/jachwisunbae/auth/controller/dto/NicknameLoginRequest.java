package com.jachwisunbae.auth.controller.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NicknameLoginRequest(
        @Schema(description = "닉네임. 처음 보는 닉네임이면 새 회원을 만든다", example = "이자취")
        @NotBlank @Size(max = 50) String nickname,

        @Schema(description = "선택 비밀번호. 생략하면 같은 닉네임을 아는 누구나 접근할 수 있는 공유 회원이 된다. "
                + "4~64자, UTF-8 72바이트 이하")
        @Size(max = 100) String password) {
}
