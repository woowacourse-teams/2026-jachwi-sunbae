package com.jachwisunbae.member.controller.dto;

import com.jachwisunbae.member.service.MemberProfile;
import io.swagger.v3.oas.annotations.media.Schema;

public record MemberDetailResponse(
    @Schema(description = "회원 ID")
    long id,

    @Schema(description = "닉네임(표시 이름)", example = "이자취")
    String name,

    @Schema(description = "비밀번호로 보호된 닉네임인지 여부")
    boolean passwordProtected
) {

    public static MemberDetailResponse from(MemberProfile profile) {
        return new MemberDetailResponse(profile.member().getId(), profile.member().getNickname(),
                profile.passwordProtected());
    }
}
