package com.jachwisunbae.auth.controller;

import com.jachwisunbae.auth.controller.dto.LoginResponse;
import com.jachwisunbae.auth.controller.dto.NicknameLoginRequest;
import com.jachwisunbae.auth.service.AuthService;
import com.jachwisunbae.common.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "닉네임 로그인과 Access Token 발급 API")
public class AuthController {

    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/nickname")
    @Operation(summary = "닉네임 로그인",
            description = "비밀번호 없이 시작하면 그 닉네임의 공유 회원으로, 비밀번호와 함께 시작하면 그 닉네임의 보호 회원으로 "
                    + "시작합니다. 회원이 없으면 새로 만들고, 보호 회원은 비밀번호가 일치해야 합니다. "
                    + "응답의 newMember는 이번 요청에서 회원을 새로 만든 경우에만 true입니다.")
    public ApiResponse<LoginResponse> loginNickname(@RequestBody NicknameLoginRequest request) {
        return ApiResponse.of(LoginResponse.from(service.loginNickname(request.toCommand())));
    }

}
