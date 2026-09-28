package com.jachwisunbae.auth.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class PasswordTest {

    @ParameterizedTest
    @ValueSource(ints = {4, 30})
    @DisplayName("4자와 30자는 허용한다")
    void allowsBoundaryLength(int length) {
        assertThat(Password.from("a".repeat(length)).value()).hasSize(length);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 3, 31})
    @DisplayName("1~3자와 31자는 허용하지 않는다")
    void rejectsOutOfRangeLength(int length) {
        assertInvalid("a".repeat(length));
    }

    @Test
    @DisplayName("공백도 비밀번호 글자로 보고 입력한 그대로 검사한다")
    void keepsWhitespace() {
        assertThat(Password.from(" ab ").value()).isEqualTo(" ab ");
        assertInvalid("   ");
    }

    @Test
    @DisplayName("바이트 수와 상관없이 글자 수로 검사한다")
    void checksCharacterCountRegardlessOfBytes() {
        assertThat(Password.from("가".repeat(30)).value()).hasSize(30);
    }

    private static void assertInvalid(String value) {
        assertThatThrownBy(() -> Password.from(value))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getCode()).isEqualTo(DomainErrorCode.NICKNAME_PASSWORD_INVALID));
    }
}
