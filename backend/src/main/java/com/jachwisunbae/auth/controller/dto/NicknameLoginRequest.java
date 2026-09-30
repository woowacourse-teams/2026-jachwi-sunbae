package com.jachwisunbae.auth.controller.dto;

import com.jachwisunbae.auth.service.dto.command.NicknameLoginCommand;
import io.swagger.v3.oas.annotations.media.Schema;

// 길이와 형식 검증은 Nickname, Password가 맡는다.
public record NicknameLoginRequest(
        @Schema(description = "닉네임. 앞뒤 공백을 제거한 뒤 1~30자. 처음 보는 닉네임이면 새 회원을 만든다", example = "이자취")
        String nickname,

        @Schema(description = "선택 비밀번호. 4~30자. 생략하거나 빈 값이면 같은 닉네임을 아는 누구나 접근할 수 있는 공유 회원이 된다")
        String password) {

    public NicknameLoginCommand toCommand() {
        return new NicknameLoginCommand(nickname, password);
    }
}
