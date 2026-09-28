package com.jachwisunbae.auth.controller.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.jachwisunbae.auth.service.dto.result.LoginResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class LoginResponseTest {

    @Test
    @DisplayName("로그인 결과를 Bearer 토큰 응답으로 변환한다")
    void convertsLoginResultToBearerResponse() {
        LoginResult result = new LoginResult("token", 43_200, true, 7L, "자취초보", false);

        LoginResponse response = LoginResponse.from(result);

        assertThat(response).isEqualTo(new LoginResponse("token", "Bearer", 43_200, true,
                new LoginMemberResponse(7L, "자취초보", false)));
    }
}
