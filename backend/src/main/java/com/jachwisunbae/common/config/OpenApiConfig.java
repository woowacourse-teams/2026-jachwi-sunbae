package com.jachwisunbae.common.config;

import com.jachwisunbae.auth.web.AuthenticatedMemberId;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.utils.SpringDocUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    static {
        // @AuthenticatedMemberId는 Access Token에서 채우는 값이다. 이걸 알려 주지 않으면
        // springdoc이 회원 ID를 필수 쿼리 파라미터로 문서에 실어, 문서를 보고 맞춘 클라이언트가
        // 실제로는 서버가 무시하는 memberId를 붙이게 된다.
        SpringDocUtils.getConfig().addAnnotationsToIgnore(AuthenticatedMemberId.class);
    }

    @Bean
    public OpenAPI jachwiSunbaeOpenApi() {
        return new OpenAPI()
                .components(new Components().addSecuritySchemes("bearerAuth",
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")))
                .info(new Info()
                        .title("자취 선배 API")
                        .version("v1")
                        .description("후보 매물과 체크리스트를 관리하는 API입니다."));
    }
}
