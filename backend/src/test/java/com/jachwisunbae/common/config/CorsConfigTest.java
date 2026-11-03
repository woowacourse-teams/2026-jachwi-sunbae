package com.jachwisunbae.common.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class CorsConfigTest {

    private static final String FRONTEND_ORIGIN = "https://dev.jachwi-sunbae.kr";

    @Test
    @DisplayName("리프레시 쿠키를 보내는 교차 출처 요청에 자격 증명을 허용한다")
    void allowsCredentialsForCrossOriginRefreshRequest() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/refresh");
        request.addHeader("Origin", FRONTEND_ORIGIN);
        MockHttpServletResponse response = new MockHttpServletResponse();

        new CorsConfig(List.of(FRONTEND_ORIGIN)).corsFilter().getFilter()
                .doFilter(request, response, new MockFilterChain());

        assertThat(response.getHeader("Access-Control-Allow-Origin")).isEqualTo(FRONTEND_ORIGIN);
        assertThat(response.getHeader("Access-Control-Allow-Credentials")).isEqualTo("true");
    }
}
