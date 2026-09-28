package com.jachwisunbae.auth.config;

import com.jachwisunbae.auth.token.JwtTokenProvider;
import com.jachwisunbae.auth.web.AuthenticatedMemberIdResolver;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.password.Pbkdf2PasswordEncoder;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AuthConfig {

    private static final String PBKDF2_ENCODING_ID = "pbkdf2";

    @Bean
    public WebMvcConfigurer authenticatedMemberIdConfigurer(AuthenticatedMemberIdResolver resolver) {
        return new WebMvcConfigurer() {
            @Override
            public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
                resolvers.add(resolver);
            }
        };
    }

    // 새 비밀번호는 PBKDF2로 저장한다. BCrypt는 72바이트를 넘는 비밀번호를 받지 않아 한글 25자 이상을 쓸 수 없다.
    // 접두어가 없는 기존 BCrypt 해시도 계속 검증해 이미 비밀번호를 설정한 회원이 로그인할 수 있게 한다.
    @Bean
    public PasswordEncoder passwordEncoder() {
        DelegatingPasswordEncoder encoder = new DelegatingPasswordEncoder(PBKDF2_ENCODING_ID,
                Map.of(PBKDF2_ENCODING_ID, Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8()));
        encoder.setDefaultPasswordEncoderForMatches(new BCryptPasswordEncoder());
        return encoder;
    }

    @Bean
    public JwtTokenProvider jwtTokenProvider(
            @Value("${auth.jwt.secret}") String base64Secret,
            @Value("${auth.jwt.issuer}") String issuer,
            @Value("${auth.jwt.audience}") String audience,
            @Value("${auth.jwt.access-token-seconds}") long seconds,
            Clock clock) {
        return new JwtTokenProvider(base64Secret, issuer, audience, seconds, clock);
    }
}
