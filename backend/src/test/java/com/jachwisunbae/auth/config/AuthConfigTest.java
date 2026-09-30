package com.jachwisunbae.auth.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthConfigTest {

    private final PasswordEncoder passwordEncoder = new AuthConfig().passwordEncoder();

    @Test
    @DisplayName("72바이트가 넘는 비밀번호도 저장하고 검증한다")
    void encodesWithPbkdf2WithoutByteLimit() {
        String password = "가".repeat(30);

        String hash = passwordEncoder.encode(password);

        assertThat(passwordEncoder.matches(password, hash)).isTrue();
        assertThat(passwordEncoder.matches("가".repeat(29) + "나", hash)).isFalse();
    }
}
