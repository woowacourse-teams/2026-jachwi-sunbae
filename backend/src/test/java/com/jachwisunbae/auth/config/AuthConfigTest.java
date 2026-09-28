package com.jachwisunbae.auth.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthConfigTest {

    private final PasswordEncoder passwordEncoder = new AuthConfig().passwordEncoder();

    @Test
    @DisplayName("새 비밀번호는 PBKDF2로 저장하고 72바이트가 넘어도 검증한다")
    void encodesWithPbkdf2WithoutByteLimit() {
        String password = "가".repeat(30);

        String hash = passwordEncoder.encode(password);

        assertThat(hash).startsWith("{pbkdf2}");
        assertThat(passwordEncoder.matches(password, hash)).isTrue();
        assertThat(passwordEncoder.matches("가".repeat(29) + "나", hash)).isFalse();
    }

    @Test
    @DisplayName("접두어 없는 기존 BCrypt 해시도 검증한다")
    void matchesLegacyBcryptHash() {
        String legacyHash = new BCryptPasswordEncoder().encode("1234");

        assertThat(passwordEncoder.matches("1234", legacyHash)).isTrue();
        assertThat(passwordEncoder.matches("9999", legacyHash)).isFalse();
    }
}
